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

        const jsdocHeader = clone.querySelector(".jsdoc-header");
        this.jsdocContainer = clone.querySelector(".jsdoc-container");
        this.openBtn = clone.querySelector(".open-btn");
        clone.querySelectorAll("pre code").forEach((block) => {
            hljs.highlightBlock(block);
        });

        jsdocHeader.addEventListener("click", () => {
            const isOpen = this.jsdocContainer.classList.contains("open");
            this.jsdocContainer.classList.toggle("close");
            this.jsdocContainer.classList.toggle("open");

            this.openBtn.classList.remove(isOpen ? "icon-down-open" : "icon-right-open");
            this.openBtn.classList.add(isOpen ? "icon-right-open" : "icon-down-open");
        });

        this.attachShadow({ mode: "open" }).appendChild(clone);
        this.addEventListener("open", () => {
            const isOpen = this.jsdocContainer.classList.contains("open");
            if (isOpen) {
                return;
            }
            this.jsdocContainer.classList.toggle("close");
            this.jsdocContainer.classList.toggle("open");

            this.openBtn.classList.remove("icon-right-open");
            this.openBtn.classList.add("icon-down-open");
        });
        this.addEventListener("close", () => {
            const isOpen = this.jsdocContainer.classList.contains("open");
            if (!isOpen) {
                return;
            }
            this.jsdocContainer.classList.toggle("close");
            this.jsdocContainer.classList.toggle("open");

            this.openBtn.classList.remove("icon-down-open");
            this.openBtn.classList.add("icon-right-open");
        });
    }
}

customElements.define("expanding-list", ExpandingList);
customElements.define("jsdoc-descriptor", JSDocDescriptor);

function dispatchEventToDescriptor(eventName) {
    document.querySelectorAll("jsdoc-descriptor")
        .forEach((descriptor) => descriptor.dispatchEvent(new Event(eventName)));
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("open-all-descriptor")
        .addEventListener("click", () => dispatchEventToDescriptor("open"));
    document.getElementById("close-all-descriptor")
        .addEventListener("click", () => dispatchEventToDescriptor("close"));
});
