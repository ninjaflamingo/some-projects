import { html, css, LitElement } from 'https://unpkg.com/@polymer/lit-element@latest/lit-element.js?module';


class NinjaButton extends LitElement{
    static get properties(){
        return {
            icon: { type: String }
        }
    }

     constructor(){
        super();
    }

    static get styles() {
        return [css`
            button {
                display: inline-block;

                background-color: transparent;
                color: #7952b3;

                border: 2px solid #456990;
                border-radius: .25rem;

                text-align: center; 
                vertical-align: middle;

                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;

                padding: .375rem .75rem;
                font-size: 1rem;
                font-weight: 600;
                line-height: 1.5;

                transition: background-color .5s ease-in-out;
            }

            button:hover{
                background-color: rgba(69,105,144,0.3);
            }

            img{
                vertical-align: middle;
            }
        `];
    }
 
    render(){
        return html`<button><img src="icons/${this.icon}.svg" height="17" width="17"></button>`
    }

}

customElements.define('ninja-button', NinjaButton);
export { NinjaButton };