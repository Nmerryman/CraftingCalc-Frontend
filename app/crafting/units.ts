import * as _ from "lodash";
import path from "path";
import { printArray } from "../utils/format";

class BaseThing {
    name: string;
    imgUrl?: string;
    sourceUrl?: string;
    isBase: boolean = false;
    isAvailable: boolean = true;
    durability: number = -1;
    tags: Array<string> = []

    constructor(name: string, config = {}) {
        // I'm ok doing it like this because my defaults are pretty good
        this.name = name;

        if (config) {
            Object.assign(this, config);
        }

    }

}


export class Resource extends BaseThing {
    // What if there are gasses in decimal form
    baseQuantity: number = 1;

    constructor(name: string, config = {}) {
        super(name, config);
    }

}


export class Process extends BaseThing {
    // I'm not sure if there is anything unique about this
    constructor(name: string, config = {}) {
        super(name, config);
    }
}


export class ProbabilityStyle {
    constructor(
        public value: number, 
        public probability: number, 
        public rolls: number = 1
    ) {}

}


export class Stack {
    constructor(
        public resourceName: string, 
        public amount: number = 1
    ) {}

}



export class Recipe {
    constructor(
        public processUsed: string, 
        public inputResources: Array<Stack>, 
        public outputResources: Array<Stack>, 
        public outputBonusChances: Array<[string, ProbabilityStyle]> = [], 
        public timeSpent: number = 0,
        public id?: number  // This is optional because we can set it as it gets inserted into the collection
    ) {}

    
    // We could absolutly cache these methods.
    _getUniqueNames(array: Array<Stack>): Array<string> {
        let names: Array<string> = [];
        for (let resource of array) {
            if (!names.includes(resource.resourceName)) {
                names.push(resource.resourceName);
            }
        }
        return names;
    }

    getInputNames(): Array<string> {
        return this._getUniqueNames(this.inputResources);
    }

    getOutputNames(): Array<string> {
        return this._getUniqueNames(this.outputResources);
    }

    getOutputNamesChances(): Array<string> {
        let names: Array<string> = [];
        for (let resource of this.outputBonusChances) {
            if (!names.includes(resource[0])) {
                names.push(resource[0]);
            }
        }
        return names;
    }
}


type recipeVariants = {
    variants: Array<recipeChainNode>
}
type recipeSources = {
    items: Array<recipeVariants>
}

class recipeChainNode {
    // src: [each item][each recipe]  ie. what are the source resources to finish the recipe
    src: recipeSources = {items: []};
    constructor(public rId: number, public goal: string, public root: boolean = false) {}
}


type craftingPathPart = {
    itemIndex: number;
    choice: number;
}

class craftingPathChoice {
    path: Array<craftingPathPart> = []  // Last choice can also be used to carry the choice count.

}


class chainCollections {

    // collection: []
    decisionNodes: Array<craftingPathChoice> = [];


    // findNode(value: craftingPath): recipeChainPathInfo|null {
    //     for (let node of this.nodes) {
    //         if (_.isEqual(node.path, value)) {
    //             return node;
    //         }
    //     }
    //     return null;
    // }

}

type choiceState = {
    node: recipeChainNode,
    location: craftingPathChoice
}

class chainHuristicsStats {
    steps: number = 0;
    input: Array<Stack> = [];
    inputStack: Array<Stack> = [];
    output: Array<Stack> = [];
    longest_depth: number = 0;
    fixed_src: recipeChainNode = new recipeChainNode(0, "");

    constructor(public src: recipeChainNode, public choices: Array<craftingPathChoice>, public data: CraftingData) {
        // Evaluate attributes here

        this.applyChoices();

    }

    applyChoices() {
        // this.fixed_src = this.src[this.choices[0]];
        let root_fixed = new recipeChainNode(this.src.rId, this.src.goal, true);

        let src_stack: Array<choiceState> = [{node: this.src, location: {path: [{itemIndex: 0, choice: 0}]}}];
        let fixed_stack: Array<recipeChainNode> = [root_fixed];

        while (src_stack.length > 0) {
            let current_src = src_stack.at(-1)!;
            let current_pointing = current_src.location.path.at(-1)!;
            // If item index is past the last needed index meaning we've been through all needed items.
            if (current_pointing.itemIndex == current_src.node.src.items.length) {
                src_stack.pop();
                fixed_stack.pop();
            } else if (current_pointing.choice == current_src.node.src.items[current_pointing.itemIndex].variants.length) {
                current_pointing.choice = 0;
                current_pointing.itemIndex++;
            } else { // We are currently pointing at some valid variant
                let tempPointing = current_src.node.src.items[current_pointing.itemIndex].variants[current_pointing.choice];
                let tempNew = new recipeChainNode(tempPointing.rId, tempPointing.goal);

                // Ensure that the fixed node skeleton is correct
                while (fixed_stack[fixed_stack.length - 1].src.items.length != current_src.node.src.items.length) {
                    fixed_stack[fixed_stack.length - 1].src.items.push({variants: []})
                }
                
                // Push changes
                fixed_stack[fixed_stack.length - 1].src.items[current_pointing.itemIndex].variants.push(tempNew);
                src_stack.push({node: tempPointing, location: {path: current_src.location.path.concat({itemIndex: 0, choice: 0})}});
                fixed_stack.push(tempNew);

                // Update state
                current_pointing.choice++;
            }
        }

        this.fixed_src = root_fixed;
    }

    extractInfo(current: recipeChainNode | null, depth: number = 0) {
        if (!current) {
            return;
        }
        
        this.steps++;
        this.longest_depth = Math.max(this.longest_depth, this.steps);

        let recipe = this.data.getRecipe(current.rId) as Recipe;

        // Handle current recipe output
        if (this.inputStack.length == 0) {  // Only happens on the root of the tree
            for (let resource of recipe.outputResources) {
                this.output.push(resource)
            }
        } else {
            // Does our current recipe get used to satisfy the last seen node?
            let stackTarget = _.nth(this.inputStack, -1) as Stack;
            let found = recipe.outputResources.find((res) => {return res.resourceName == stackTarget.resourceName});

            if (found) {  // The only way to get a false positive is for an alternative output to match up with a different part of the input stack. I'm not handling that case as it's very unlikely (I hope).
                let ratio = stackTarget.amount / found.amount;
                this.inputStack.pop();
                // for 
            }

        }

    }

}


export class CraftingData {
    resources: Record<string, Resource>;
    processes: Record<string, Process>;
    recipes: Array<Recipe>;
    private rId: number = 0;  // Used to register recipes and give them unique ids/names


    constructor(resources: Record<string, Resource> = {}, processes: Record<string, Process> = {}, recipes: Array<Recipe> = []) {
        this.resources = resources;
        this.processes = processes;
        this.recipes = recipes;

        // Validate that all recipes have id's set to comply with expectations later
        this.validateRecipeIds();
    }

    setResource(m: Resource) {
        this.resources[m.name] = m;
    }

    setProcess(p: Process) {
        this.processes[p.name] = p;
    }

    setRecipe(r: Recipe) {
        if (this.recipes.length > 0) {  // Hack to set a safe current id
            this.rId = this.recipes[this.recipes.length - 1].id! + 1
        }
        if (!r.id) {
            r.id = this.rId++;
        }
        this.recipes.push(r);
    }

    getRecipe(id: number): Recipe | undefined {
        return this.recipes.find((element) => {return element.id == id})
    }

    removeResource(name: string) {
        delete this.resources[name];
    }

    removeProcess(name: string) {
        delete this.processes[name];
    }

    removeRecipe(id: number) {
        this.recipes = this.recipes.filter((r) => {return r.id != id});
    }

    findRecipesFor(name: string): Array<number> {
        // Takes the name of a Resource as input.
        // returns the id of each matched recipe. This is to stay in line with all of the other name lookups.
        let matches: Array<number> = []
        for (let recipe of this.recipes) {
            if (recipe.getOutputNames().includes(name)) {
                matches.push(recipe.id!);
            }
        }
        return matches;

    }

    validateRecipeIds() {
        // Just set them all. That way there will never be an issue with gaps
        this.rId = 0;
        for (let r of this.recipes) {
            r.id = this.rId++;
        }
    }

    shallowClone() {
        return new CraftingData(this.resources, this.processes, this.recipes)
    }

    createChainTree(start: recipeChainNode, dupeCheck: Set<string>) {
        // We assume that the start has the recipe id and we are trying to fill in all of the src children
        if (!this.getRecipe(start.rId)) {
            console.log("Something went very wrong");
            console.log(this.recipes);
        } 

        // console.log(dupeCheck);
        if (dupeCheck.size > 20) {
            console.log("dupeCheck is probably in recursion. Killing.")
            return;
        }

        for (let resourceName of this.getRecipe(start.rId)!.getInputNames()) {  // for every resource needed to complete the recipe

            let tempItemRecipes = this.findRecipesFor(resourceName);  // Collect all recipes that could be used for this resource
            let variantArray: recipeVariants = {variants: []};
            for (let recipeId of tempItemRecipes) {
                let dupeVal = JSON.stringify([recipeId, resourceName]);
                if (!dupeCheck.has(dupeVal)) {  // Check if this part of the recipe has already been used in the chain
                    let tempDupeCheck = new Set(dupeCheck);
                    tempDupeCheck.add(dupeVal);  // Add current use to the dupe check
                    let tempNode = new recipeChainNode(recipeId, resourceName);
                    this.createChainTree(tempNode, tempDupeCheck);
                    variantArray.variants.push(tempNode);
                }
            }
            
            start.src.items.push(variantArray);
        }
    }

    collectDecisionHashes(start: recipeChainNode, collectionData: chainCollections, pathHash: craftingPathChoice) {

        start.src.items.forEach((item, item_pos) => {
            if (item.variants.length > 1) {  // This item has multiple recipes.
                let tempPath = _.cloneDeep(pathHash)
                tempPath.path.push({itemIndex: item_pos, choice: item.variants.length});

                collectionData.decisionNodes.push(tempPath);
            }
            item.variants.forEach((recipe, recipe_pos) => {
                let tempPath = _.cloneDeep(pathHash);
                tempPath.path.push({itemIndex: item_pos, choice: recipe_pos});

                this.collectDecisionHashes(recipe, collectionData, tempPath);
            })
        })
    } 

    generateChoicePermutations(choices: Array<craftingPathChoice>): Array<Array<craftingPathChoice>> {
        let maxes: Array<number> = [];
        let indexes: Array<number> = [];

        // Extract data to set up state arrays
        for(let choice of choices) {
            maxes.push(choice.path.at(-1)!.choice);
            indexes.push(0);
        }

        // Loop stoping info
        let start_state = _.clone(indexes);
        let first = true;

        let result: Array<Array<craftingPathChoice>> = []

        let iteration_count = 0;
        while (!_.isEqual(indexes, start_state) || first) {
            if (iteration_count > 10000) { // This will stop insanely high numbers of permutations. Not sure if needed.
                break;
            }
            iteration_count++;
            if (first) {
                first = false;
            }

            let temp_perm = [];
            for (let i = 0; i < indexes.length; i++) {  // For each permutation entry
                let temp_choice = _.cloneDeep(choices[i]);
                temp_choice.path.at(-1)!.choice = indexes[i];
                temp_perm.push(temp_choice);
            }

            result.push(temp_perm);

            // Increment the permutation
            let mut_index = 0;
            while (true) {
                indexes[mut_index]++;
                if (indexes[mut_index] == maxes[mut_index]) {
                    indexes[mut_index] = 0;
                    mut_index++;
                } else {
                    break;
                }

                // We reach the end of the "number"
                if (mut_index == indexes.length) {
                    break;
                }
            }

        }


        return result;
    }





    calcChain(start: string) {
        // Options hold all found paths to get to the item.
        // let options: Array<recipeChainNode> = [];
        let options = new recipeChainNode(0, "", true)  // Name is unique enough to not hit anything
        options.src.items.push({variants: []});
        let dupeCheck: Set<string> = new Set();
        for (let possibleRecipes of this.findRecipesFor(start)) {
            let tempNode = new recipeChainNode(possibleRecipes, start);
            this.createChainTree(tempNode, dupeCheck);
            options.src.items[0].variants.push(tempNode);
        }

        // Find decisions
        let collectionStore = new chainCollections();
        // options.src.items[0].variants.forEach((option, option_index) => {
        //     this.collectDecisionHashes(option, collectionStore, new craftingPathChoice(option_index));  // Set first value to be the option index
        // })
        this.collectDecisionHashes(options, collectionStore, new craftingPathChoice())
        // printArray(collectionStore.decisionNodes)
        console.log(collectionStore)

        // Optimize to create the best tree
        // I think we recommend the path that has the highest ratio of base items and if tied, the shortest path.
        let permutations = this.generateChoicePermutations(collectionStore.decisionNodes)
        console.log(permutations);

        let huristics = new chainHuristicsStats(options, permutations[0], this);
        console.log(JSON.stringify(options));
        console.log(JSON.stringify(huristics.fixed_src));
        

        return options;
    }

}
