/* eslint-disable jsdoc/require-jsdoc */
"use strict";

class ExpandingList extends HTMLElement {
    connectedCallback() {
        /** @type {HTMLTemplateElement} */
        const template = document.getElementById("expanding-list");
        const clone = template.content.cloneNode(true);

        const listItems = clone.querySelector(".list-items");
        const listBtn = clone.querySelector(".list-btn");
        clone.querySelector(".sub-title").addEventListener("click", () => {
            const isClosed = listItems.classList.contains("closed");

            listBtn.textContent = isClosed ? "-" : "+";
            listItems.classList.toggle("closed");
        });

        this.attachShadow({ mode: "open" }).appendChild(clone);

        const paragraphElement = document.createElement("p");
        paragraphElement.setAttribute("slot", "title");
        paragraphElement.appendChild(document.createTextNode(this.getAttribute("title")));
        this.appendChild(paragraphElement);
    }
}

class JSDocDescriptor extends HTMLElement {
    connectedCallback() {
        /** @type {HTMLTemplateElement} */
        const template = document.getElementById("jsdoc-descriptor");
        const clone = template.content.cloneNode(true);

        this.attachShadow({ mode: "open" }).appendChild(clone);
    }
}

customElements.define("expanding-list", ExpandingList);
customElements.define("jsdoc-descriptor", JSDocDescriptor);

document.addEventListener("DOMContentLoaded", () => {
    // do something
});
