document.addEventListener("DOMContentLoaded", () => {
    const titles = document.querySelectorAll(".title");

    for (const title of titles) {
        title.addEventListener("click", function test(event) {
            const spanClass = this.querySelector(".icon-right-dir").classList;
            const content = this.nextElementSibling.classList;
            if (spanClass.contains("active")) {
                spanClass.remove("active");
                content.add("close");
                content.remove("open");
            }
            else {
                spanClass.add("active");
                content.remove("close");
                content.add("open");
            }
        });
    }
});
