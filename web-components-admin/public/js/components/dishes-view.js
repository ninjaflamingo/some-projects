import { html, css, LitElement } from 'https://unpkg.com/@polymer/lit-element@latest/lit-element.js?module';
import { NinjaButton } from './ninja-button.js';

const generateObjectId = () => {
    let timestamp = (new Date().getTime() / 1000 | 0).toString(16);
    return timestamp + 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, function() {
        return (Math.random() * 16 | 0).toString(16);
    }).toLowerCase();
};

const createNewDish = () => {
    return {
        _id: generateObjectId(),
        name: 'Name',
        description: 'Description',
        category: '',
        price: 0,
        zindex: null
    }
};

class DishesView extends LitElement{
 
    static get properties(){
        return {
            dishes: { type: Array },
            dish: { type: Object },
            editMode: { type: Boolean }
        }
    }

    constructor(){
        super();
        this.dishes = [];
        this.dish = createNewDish();
        this.editMode = false; 
    }

    async connectedCallback(){
        super.connectedCallback();
        const data = await this.fetchData();
        this.dishes = data;
        //this.requestUpdate();
    }

    async fetchData(){
        const res = await fetch('/api/dishes');
        const json = await res.json();
        return json;
    };

    saveDish(e){
        let inputs = e.target.parentNode.querySelectorAll('input')
        inputs.forEach((input) => { this.dish[input.name] = input.value });
        // if null, it's a new dish
        if(this.dish.zindex === null && this.dishes.length != 0){
            this.dish.zindex = this.dishes[this.dishes.length-1].zindex + 1;
            this.dishes = [...this.dishes, this.dish];
        }else if(this.dishes.length == 0){
            this.dish.zindex = 0;
            this.dishes = [this.dish]
        }else{
            this.dishes[this.dish.zindex] = this.dish;
        }
        this.editMode = !this.editMode;
    }

    moveDishUp(e){
        let { parentNode } = e.target; 
        let wrapper = parentNode.parentNode;
        let zindex = parentNode.zindex;
        let containers = wrapper.querySelectorAll(".panel");

        if(zindex-1 != -1){
            let replacedSibling = containers[zindex - 1]

            replacedSibling.zindex = zindex;
            parentNode.zindex = zindex - 1;
            wrapper.insertBefore(parentNode, containers[zindex-1]);
            
            this.dishes[zindex - 1].zindex = zindex;
            this.dishes[zindex].zindex = zindex - 1;
            this.dishes.sort((a, b) => a.zindex - b.zindex);

        }else{
            alert('Element is alraedy first element');
        }
    }

    moveDishDown(e){
        let { parentNode } = e.target; 
        let wrapper = parentNode.parentNode;
        let zindex = parentNode.zindex; 
        let containers = wrapper.querySelectorAll(".panel");

        if(zindex + 1 < containers.length){
            let replacedSibling = containers[zindex + 1]

            replacedSibling.zindex = zindex;
            wrapper.insertBefore(parentNode, containers[zindex+1].nextSibling);
            parentNode.zindex = zindex + 1;

            this.dishes[zindex + 1].zindex = zindex;
            this.dishes[zindex].zindex = zindex + 1;
            this.dishes.sort((a, b) => a.zindex - b.zindex);
        }else{
            alert('Element is alraedy last element');
        }
    }

    removeDish(e){
        let { parentNode } = e.target;
        let zindex = parentNode.zindex;
        let wrapper = parentNode.parentNode;
        // remove from DOM and Array 
        let removedDish = this.dishes.splice(zindex, 1);
        wrapper.removeChild(parentNode)
        // update zindex for DOM and Array items 
        let containers = wrapper.querySelectorAll(".panel");
        for(var i = zindex; i < this.dishes.length; i++){
            this.dishes[i].zindex--;
            containers[i].zindex--;
        }

        const url = '/api/dishes';
        const data = removedDish[0]; // splice returns array 
        console.log(data)
        fetch(url, {
            method: 'DELETE', 
            body: JSON.stringify(data), 
            headers:{
                'Content-Type': 'application/json'
            }
        }).then(res => res.json())
        .then(response => alert('Success'))
        .catch(error => console.log(error));
    }

    
    saveChanges(){

        const url = '/api/dishes';
        const data = this.dishes;
        console.log(data)
        fetch(url, {
            method: 'POST', 
            body: JSON.stringify(data), 
            headers:{
                'Content-Type': 'application/json'
            }
        }).then(res => res.json())
        .then(response => alert('Success'))
        .catch(error => console.log(error));
    }


    static get styles() {
        return [css`

        .wrapper {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            grid-column-gap: 1em;
            margin: 1em;
        }

        .panel, .editor {
            padding: 1rem;
            border: 2px solid #456990;
            border-radius: .25rem;
            margin-bottom: 1rem;
        }

        .panel h2{
            color: #456990;
        }

        .editor input, .editor select{
            line-height: 1.5em;
            font-size: 1rem;
            margin-top: .5em;
            margin-bottom: .5em;
            border: 2px solid #456990;
            padding: .25rem;
        }

        .editor {
            width: 50vh;
            margin: 0 auto;
            margin-top: 2rem;
        }

        .editorForm {
            display: flex;
            flex-direction: column;
        }

        .subnav {
            display: flex;
            margin-top:1em;
            margin-left:1em;
            margin-right:1em;
        }

        .subnav ninja-button{
            margin-left: 4px;
        }

        .subnav h2{
            margin: auto;
        }

        `];
    }

    render(){
        if(this.editMode){
            return html`
                <div class="editor">
                    <div class="editorForm">
                        <input type="text" name="name" value="${this.dish.name}" />
                        <input type="text" name="description" value="${this.dish.description}" />
                        <input type="text" name="price" value="${this.dish.price}" />
                    </div>
                    <ninja-button icon="check" @click=${(e) => this.saveDish(e)}>Save</ninja-button>
                    <ninja-button icon="ban" @click=${() => this.editMode = !this.editMode}>Cancel</ninja-button>
                </div>
            `
        }else{
            return html`
                <div>
                    <div class="subnav">
                        <ninja-button icon="save" @click=${(e) => {this.saveChanges()}}>Save</ninja-button>
                        <ninja-button icon="plus-square" @click=${() => {
                            this.dish = createNewDish();
                            this.editMode = !this.editMode
                        }}>Add</ninja-button>
                    </div>
                    <div class="wrapper">
                    ${this.dishes.map((dish) => html`
                        <div .zindex=${dish.zindex} class="panel">
                            <h2>${dish.name}</h2>
                            <p>description: ${dish.description}</p>
                            <p>price: ${dish.price}</p>
                            <ninja-button icon="pencil-alt" @click=${() => {
                                this.dish = dish;
                                this.editMode = !this.editMode;
                            }}>Edit</ninja-button>
                            <ninja-button icon="trash" @click=${(e) => {this.removeDish(e)}}>Delete</ninja-button>
                            <ninja-button icon="plus-circle" @click=${this.moveDishUp}>Move Up</ninja-button>
                            <ninja-button icon="minus-circle" @click=${this.moveDishDown}>Move Down</ninja-button>
                        </div>                        
                    `)}
                    </div>
                </div>
            `
        }
    }
}

customElements.define('dishes-view', DishesView);
export { DishesView };