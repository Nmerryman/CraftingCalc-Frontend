# ResourceCalc
[Link to website](https://nmerryman.github.io/CraftingCalc/)

## Goal
The goal of this project is to be able to help calculate required resources in order to produces specific items. This site is optomized for Minecraft Modpacks, but probably works for vanilla and other factory crafting games as well.
The most similar inpiration to this project is [this calculator](https://resourcecalculator.com/minecraft/#netheriteaxe=1&netheritehoe=1).

## Requirements

### The Front End
- Allows the user to enter new items and processes
- Let the user calculate what steps are needed to produce desired items
- Finds the most profitable path if multiple exist
- Shows the user paths and then lets them refine the chain
- Does not require a back end to work properly

### The Back End
- Lets users add items and processes to presets
- Lets users load presets


### Details
All of these objects can be retrieved from the back end and updates can be pushed with user accounts. (And logging)

#### Item Data
The object stores information such as:
- Name
- Image data (Optional)
- Item state (Item, liquid, gas, etc.) (Optional)
- Base quantity (Default: 1)
- IsBase (Do we care about anything preceding this)
- IsAvailable (Do we have access to the item at all) (Default: 1) (Optional)
- Durability (Can we reuse items multiple times) (Default: -1) (Optional)
- Mod source/other tags (tier/game stage)

#### Process Data
This object stores the information for a single machine:
- Name
- Image Data (Optional)
- Construction cost (Optional)
- IsBase (Some machines produce thing passively)
- Process modifiers (Think upgrades)

#### Recipe Data
Each Input -> Process -> Output is stored in these objects:
- Process used
- Input items
- Output items
- Statistical output bonuses
- Time spent (Optional)

#### Page Toggles
Other general settings are stored here:
- Rely on parts of recepies that use probabilities
- Search depth max
- Include multiple paths to produce more resources/optimize the paths
- Optimize for min (time, crafting materials, machines, extra remaining materials) 
(Happens when some recepies may boost output by including a fraction of the total resources (HDPE Pellets))

The default page is similar to the linked site where there are final items to choose from and a way to generate the crafting path with all of the other stats the page shows. Stats will also include details such as minimum and maximum required machines, time spent, and steps required. In addition to that, it will give the option to hover over recepies and block or update certain items and processes which will update the tree after clicking update. If a non base item has no preceding recepies, it is highlighted for inspection. 

The algoriths will do an exhaustive search for all ways to reach from final item to starting resources. (Unless the depth reaches too deep) All different processes that result in essencially duplicate recepies will be collapsed, the user can pick the primary process chosen. 

In order to ease all steps, there will be interactive search bars to help find any of the data objects. Selecting a menu button on the object will open up a configuration page that can create/edit/delete an object.

At the top of the page there will be a menus to interact with the backend.
- On page load, display a color to detect if the backend is accessable
- A dropdown to load a preset from the server
- If a preset is selected, and the user is logged in, any time an object is edited, provide a push toggle to also update the server


## Technology Used
The front end will be created with NextJs via React while the back end will use Expressjs both with TypeScript. The back end will use docker to host the program.

Instructions:
Make sure to have Nodejs installed
`npx create-next-app@latest`  was used to create the project. (Not required to start working)
Instead run `npm install` in the same directory as the `package.json` file.
`npm run dev` started the local server for testing.
`npm run build` put html files in the output folder for static use.

## Page Layout
From the top to bottom (and maybe left to right)
- Page info stuff
- Login and preset stuff
- Crafting request (CaftingReq) area
- Svg render
- Crafting Tree Breakdown (CTB) area

## Notes/TODO
Right now there will be no focus on handeling recursive recipes
- iron -> nuggets -> iron
- bucket -> milk bucket -> cake + bucket
No focus on merging recipe paths
- gravel -> sand + ore -> combined later
No focus on using bonus chances

`_available_local` are restricted names in localStorage. They are used to cache information.


# Helping Instructions
## Git - Downloading and pushing file updates
command #(divider)# description

git pull                        # download updates

git checkout [branch name]      # Go to other version of files

git checkout -b [branch name]   # Go there and make the branch if it doesn't already exist

git status                      # List what files have changed

git diff                        # Look at all of the changes. Arrows to move and q to quit

git add [list of names]         # What files to save

git add .                       # Mark all changed files to save

git commit -m "[What was done?]" # Save all changes to git

git merge [branch name]         # Pull updates from branch name into the current one

git push                        # Push the changes to the shared repository

git stash                       # Temporarily remove uncommited changes (Saves it for later)

git stash pop                   # Reapply the uncommited changes

## Npm - The thing that hosts the test website
npm install # Install packages for development

npm run dev # Host the dev website. It has hot reloading.


# Easy tasks?
- Make text and buttons look ok for different resolutions
- Make Change the way anything that could be improved looks
- Add check boxes to each thing under thing under the SVG
- Add a dropdown to select which crafting path chosen (Currently only the "Best" is chosen)


# Demo order
- What can it do? Req dispenser - Show off basic ui
- What if my build needs multiple items? Req multiple items (piston, repeater, redstone) - Lines intertwine + calculations work
- But I don't have redstone ore? Disable redstone ore/deepslate - Items can be disabled + undo
- I have plenty of redstone! Mark redstone as base
- What can I use as fuel? Show cooking time recipe - Show toggles between permutations + multirecipe view
- But what If I'm not playing vanilla? Change to backpack - Show how loading local works
- How would I make my own? Open generator in new tab - Show examples and then select default (show editable)
- How can I save/share this? - show off that text got copied and load + display pickaxe
- What if there is too much data to past to friends? Fix default pickaxe stick count + change name - remote save
- I want to delete what I downloaded! Load remote + reset + load remote
- Demo - Hammer durability analysis - sticks + iron/copper/gold at 30/20/5 durability = hammer + iron -> plate. Request many plates (100). Maybe set copper to lower value
