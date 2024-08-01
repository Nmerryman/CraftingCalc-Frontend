import { useState, Dispatch, SetStateAction } from "react";
import Popup from 'reactjs-popup'
import 'reactjs-popup/dist/index.css'
import {CraftingData, Resource, Process, Recipe} from '../crafting/units'
import { CraftingAction, craftingReducer } from "../components/crafting"

export function togglePopupCallback(state: boolean, setter: Dispatch<SetStateAction<boolean>>) {
    return () => {console.log("toggle"); setter(!state)};
}

const AddItem = (
    <div>
    <label>
        Item Name: <input id="item_name" className="popup_text"></input>
    </label>
    <label>
        Is this a Base Material? <input type="checkbox" id="base_check"></input>
    </label>    
    <div>
        <label>
            What is the Durability of the Item (If Applicable): <input type="number" id="durability" defaultValue={''} min={0} className="popup_text"></input>
        </label>
    </div>
</div>
)

// export function PopupEditor({popupState, popupToggle}: {popupState: boolean, popupToggle: () => void}) {
//     if (popupState) {
//         return (
//             <div id="popupBox" className="absolute top-30 left-32 h-1/3 w-1/3 bg-white">
//                 <img src="https://static.vecteezy.com/system/resources/thumbnails/007/861/190/small_2x/x-symbol-for-website-icon-presentation-free-vector.jpg" onClick={popupToggle}/>
//                 <AddItem />
//             </div>
//         )
//     }
//     else {
//         return (
//             <></>
//         )
//     }
// }

export function PopupEditor({craft_act, CraftingData}: {craft_act: Dispatch<CraftingAction>, CraftingData: CraftingData}) {
    const [tab, setTab] = useState<string>('addItem');
    
    const submit = (craft_act: Dispatch<CraftingAction>, CraftingData: CraftingData, close: any) => {
        switch(tab) {
            case 'addItem':
                const name = document.getElementById('item_name') as HTMLInputElement
                const base = document.getElementById('base_check') as HTMLInputElement
                const dur = document.getElementById('durability') as HTMLInputElement
                const quant = document.getElementById('base_quant') as HTMLInputElement

                var name_val = name?.value
                var base_val = base?.value
                var dur_val = dur?.value
                var quant_val = quant?.value

                const resource = new Resource(name_val, {isBase: base_val, durability: dur_val, baseQuantity: quant_val})
                craft_act({type: 'set resource', anyValue: resource})

                console.log(CraftingData.resources[name_val])
                close();
        }
    }

    const render = (craft_act: Dispatch<CraftingAction>, CraftingData: CraftingData, close: any) => {
        switch(tab) {
            case 'addItem':
                return (
                    <div>
                        {AddItem}
                        <div>
                            What is the Smallest Quantity Attainable? <input id="base_quant" className="popup_text"></input>
                        </div>
                        <div>
                            <button className='text-black bg-gray-200 hover:bg-gray-400 popup_button'
                                onClick= {() => submit(craft_act, CraftingData, close)}>
                                    <h2>Submit</h2>
                            </button>
                        </div>
                    </div>
                );
            case 'addProcess':
                return (
                    <div>
                        {AddItem}
                        <div>
                            <button className='text-black bg-gray-200 hover:bg-gray-400 popup_button'
                                onClick= {() => submit(craft_act, CraftingData, close)}>
                                    <h2>Submit</h2>
                            </button>
                        </div>
                    </div>
                )
        }
    } 


    return (
        <div> 
            <Popup trigger=
                {<button> Popup Test</button>}
                modal nested>
                {
                    close => (
                        <div className='modal'>
                            <div className="flex">
                                <button className='text-black bg-gray-200 hover:bg-gray-400 popup_button'
                                    onClick={() => setTab('addItem')}>
                                        <h2>Add Item</h2>
                                    </button>
                                <button className='text-black bg-gray-200 hover:bg-gray-400 popup_button'
                                    onClick={() => setTab('addProcess')}>
                                        <h2>Add Process</h2>
                                    </button>
                            </div>
                            <div className='text-black text-center'>
                                {render(craft_act, CraftingData, close)}
                            </div>
                        </div>
                    )
                }
            </Popup>
        </div>
    )
}



