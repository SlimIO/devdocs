/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable no-invalid-this */
"use strict";

function sectionClick() {
    const spanClass = this.querySelector(".icon-right-dir").classList;
    const content = this.nextElementSibling.classList;

    spanClass.toggle("active");
    content.toggle("close");
    content.toggle("open");
    this.classList.toggle("active");
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".title")
        .forEach((el) => el.addEventListener("click", sectionClick));
});
