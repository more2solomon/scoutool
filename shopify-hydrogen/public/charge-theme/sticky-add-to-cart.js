class StickyAddToCard extends HTMLElement {
    animateOptions = {
        duration: 300,
        easing: "linear",
    };

    constructor() {
        super();

        this.stickyContainer = this.querySelector(".sticky-container");
        this.details = this.stickyContainer.querySelector("details");
        this.stickyContent = this.stickyContainer.querySelector(
            ".add-to-cart-sticky__content"
        );
    }

    connectedCallback() {
        this.close();
        this.details.addEventListener("click", this.handleClick.bind(this));
        document.addEventListener("scroll", this.handleScroll);
    }

    handleClick(e) {
        const details = e.target.closest("details");
        if (!details.hasAttribute("open")) {
            details.hasAttribute("open", true);
            this.open();
        } else this.close();
    }

    open() {
        const element = this.stickyContent;
        var animation = element.animate(
            { height: ["0", element.scrollHeight + "px"] },
            this.animateOptions
        );

        animation.onfinish = () => {
            element.style.height = "initial";
            element.style.opacity = "1";
        };
    }

    close() {
        const element = this.stickyContent;
        var animation = element.animate(
            { height: [element.clientHeight + "px", "0"] },
            this.animateOptions
        );

        animation.onfinish = () => {
            element.style.height = "0";
            element.style.opacity = "0";
        };
    }

    handleScroll() {
        let scrollTop = window.scrollY,
            isFotterVisible =
                window.innerHeight -
                document
                    .querySelector(".footer-section")
                    ?.getBoundingClientRect().top;
        const scrollTrigger = 1000;
        const stickyAddToCard = document.querySelector("sticky-add-to-card");

        if (
            stickyAddToCard &&
            scrollTop > scrollTrigger &&
            isFotterVisible < 0
        ) {
            stickyAddToCard.style.visibility = "visible";
            stickyAddToCard.style.marginRight = "1rem";
            stickyAddToCard.style.opacity = "1";
        } else {
            stickyAddToCard.style.visibility = "hidden";
            stickyAddToCard.style.marginRight = "-33rem";
            stickyAddToCard.style.opacity = "0";
        }
    }

    disconnectedCallback() {
        this.details.addEventListener("click", this.handleClick.bind(this));
        document.addEventListener("scroll", this.handleScroll);
    }
}

customElements.define("sticky-add-to-card", StickyAddToCard);
