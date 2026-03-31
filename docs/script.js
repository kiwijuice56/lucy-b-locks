var navVisible = false;
var navBar = document.getElementById("navBar");
var reveals = document.querySelectorAll(".fadeIn");

// https://www.nucleiotechnologies.com/fade-in-animation-when-scroll-in-your-website/
function reveal() {
    for (var i = 0; i < reveals.length; i++) {
        var windowHeight = window.innerHeight;
        var elementTop = reveals[i].getBoundingClientRect().top;
        var elementVisible = 128;

        if (elementTop < windowHeight - elementVisible) {
            reveals[i].classList.add("onScreen");
        }
    }

    if (window.pageYOffset > 128 && !navVisible) {
        navBar.classList.add("onScreen");
        navBar.classList.remove("offScreen");
        navVisible = true;
    }

    if (window.pageYOffset <= 128 && navVisible) {
        navBar.classList.add("offScreen");
        navBar.classList.remove("onScreen");
        navVisible = false;
    }
}

window.addEventListener("scroll", reveal);
reveal();