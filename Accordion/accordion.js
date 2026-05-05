class FoundationishAccordion extends HTMLElement {

    /**
     * Fields
     */

    openedState = false;

    toggleCount = 0;

    attr = {
        ready: "is-ready",
        opened: "is-opened"
    };

    panelID = false;

    /**
     * NOTE:
     *  Added a static property detailsNameSupport to store the cached result across all instances
     *  Modified supportsDetailsName() to check if the test has already run — if so, it returns the cached value immediately
     *  Only on the first call does it perform the actual detection test
     *  Now when you have 3 instances of the accordion element, the feature detection only runs once, and subsequent instances reuse the
     *  cached result.
     */

    // Cache for details name attribute support (runs once across all instances)
    static detailsNameSupport = null;


    /**
     * Observer attributes
     */

    // Observe the "opened" and "is-open" attributes for changes.
    // The browser now watches for changes to this attribute and calls attributeChangedCallback() when it changes.
    static get observedAttributes() {
        return ['opened', 'is-opened'];
    }

    /**
     * Watch for attribute changes
     */

    // This method is called whenever an observed attribute changes. It receives the name of the changed attribute, its old value, and its new value.
    // Fires whenever an observed attribute changes. It receives the name of the changed attribute, its old value, and its new value.
    attributeChangedCallback(attrName, oldValue, newValue) {
        if (attrName === 'is-opened') {
            // openAttrChangeHandler(oldValue, newValue);
        }
    }


    /**
     *  1. When connected to the DOM, run the init() method when ready.
     */

    connectedCallback() {
        this.ready();
    }

    ready() {
         /*
            document.readyState values:
            'loading'	    Document is still loading, DOM is not yet ready
            'interactive'	DOM is ready, but stylesheets/images may still be loading
            'complete'	    Everything is loaded (like window.onload)

            If your connectedCallback() fires after the DOM is already loaded (which often happens with dynamically created elements or async script loading), there's no point waiting for DOMContentLoaded—it's never going to fire again. So the function:

            1. Checks first: Is the DOM already ready? → Call init() immediately
            2. If not: Wait for DOMContentLoaded event → Then call init()

            This prevents your component from hanging if the DOM is already in the 'interactive' or 'complete' state.
        */

        // DOM is ready NOW, so init immediately
        if ( document.readyState !== 'loading' ) {
            this.init();
            return;
        }

        // Otherwise wait until the DOM is ready; Safe to query/manipulate DOM elements now. Unlike window.onload, this does not wait for stylesheets, images and fonts to load.
        document.addEventListener('DOMContentLoaded', () => {
            this.init();
        }, { once: true });
    }

    /**
     *  When initialized, do a great many things.
     *  1. Don't run if already initialized
     *  2. Get settings
     *  3. Render the markup
     *  4. iv. On "Ready" updates
     */

    init() {

        // Don't run if already initialized
        if ( this.hasAttribute( this.attr.ready ) ) return;

        // Run setup() and if it returns false, stop initialization.
        if ( ! this.setup() ) {
            return;
        }

        // Run render() and if it returns false, stop initialization.
        if ( ! this.render() ) {
            return;
        }

        // Set the "is-ready" attribute to indicate that the component is ready to use
        this.setAttribute( this.attr.ready, "");
    }


    /**
     *  3. Setup
     */

    setup() {
        // Ready to go! emit a custom event: "accordionitem:is-ready"
        this.onReadyEvent();

        this.setOpenedAttribute();

        this.supportsDetailsName();

        // Return something to detect inside init()
        return true;
    }


    /**
     *  4. Render
     */

    render() {

        let {log}=console;

        // Detect 'details' element
        if ( this.detectHTMLDetails() ) {
            this.setAttribute("provided-details",'');
        }

        // Detect provided custom markup for a disclosure pattern
        // using a button and a div
        if (
            this.detectCustomHTML()
            && !this.detectHTMLDetails()
        ) {
            this.setAttribute("provided-markup",'');
            this.renderChildHtmlDisclosure();
        }

        // Event listeners for details toggle and custom disclosure click
        this.onToggleEvent();

        // Return something to detect inside init()
        return true;
    }

    /*
        4.1 Render Helpers
    */

    renderCustomDisclosure() {
        // If the details element is not found, render a custom disclosure pattern using a button and a div
        const button = document.createElement("button");
        button.setAttribute("aria-expanded", "false");
        button.setAttribute("aria-controls", "disclosure-panel");
        button.textContent = "Toggle Accordion";

        const panel = document.createElement("div");
        panel.id = "disclosure-panel";
        panel.hidden = true;
        panel.innerHTML = "<p>This is the content of the accordion item.</p>";

        this.append(button, panel);
    }

    renderChildHtmlDisclosure() {

        // Generate a unique ID for the panel if it doesn't already have one
        let generateUniqueID = () => {
            //return "disclosure-panel-" + Math.random().toString(36).substr(2, 9);
            let id = Math.floor(Math.random() * 100000);

            // Make sure it's not already in use
            let suffix = 0;
            let existing = document.querySelector(`#fndish-panel-${id}`);
            while (existing) {
                suffix++;
                existing = document.querySelector(
                    `#fndish-panel-${id}_${suffix}`,
                );
            }

            // Set the ID on the element
            return `fndish-panel-${id}${suffix ? `_${suffix}` : ""}`;
        }

        // wrap the existing child HTML in a custom disclosure pattern using a button and a div
        let setWrapperForDisclosure = () => {
            let wrapper = document.createElement("div");
            wrapper.classList.add("disclosure");

            while (this.firstChild) {
                wrapper.appendChild(this.firstChild);
            }

            this.appendChild(wrapper);
        };

        // Set the necessary ARIA attributes on the button and panel for accessibility
        let setAttsForDisclosure = () => {
            let trigger = this.querySelector(".disclosure > button"),
                panel = this.querySelector(".disclosure > div");

            if (!panel.id) {
                this.panelID = generateUniqueID();
                panel.id = this.panelID;
            }

            if (
                !trigger.hasAttribute("aria-controls")
                || trigger.getAttribute("aria-controls") !== `#${panel.id}`
            ) {
                trigger.setAttribute("aria-controls", panel.id);
            }

            if (!trigger.hasAttribute("aria-expanded")) {
                trigger.setAttribute("aria-expanded", "false");
            }
        }

        // Add click event listener to the button to toggle the visibility of the panel and update ARIA attributes accordingly
        let addWiringForDisclosure = () => {
            let trigger = this.querySelector(".disclosure > button"),
            panel = this.querySelector(".disclosure > div");

            trigger.addEventListener("click", function() {
                if ( this.getAttribute("aria-expanded") === "true" ) {
                    this.setAttribute("aria-expanded", "false");
                    panel.setAttribute("hidden", "");

                } else {
                    this.setAttribute("aria-expanded", "true");
                    panel.removeAttribute("hidden");
                }
            });
        }

        setWrapperForDisclosure();

        setAttsForDisclosure();

        addWiringForDisclosure();
    }


    /*
        Events
    */

    onReadyEvent() {
        this.dispatchEvent(
            new CustomEvent('accordionitem:is-ready', {
                bubbles: true,
                cancelable: false,
                detail: {
                    openedState: this.openedState
                }
            } )
        );
    }

    onToggleEvent() {
        if ( this.detectHTMLDetails() ) {
            this.details = this.querySelector("details");

            this.details.addEventListener("toggle", (event) => {
                this.openedState = this.getOpenedState();
                this.setOpenedAttribute();
            });
        }

        if ( this.detectCustomHTML() ) {
            this.detectCustomHTML().trigger.addEventListener("click", (event) => {
                this.openedState = this.getOpenedState();
                this.setOpenedAttribute();
            });
        }
    }


    /*
        5. State
    */

    getOpenedState() {
        let {log} = console;
        if (this.querySelector("details") !== null) {
            return this.querySelector("details").hasAttribute("open") ? true : false;
        } else if (this.querySelector(".disclosure > button") !== null) {
            // Handle custom disclosure logic
            return this.querySelector(".disclosure > button").getAttribute("aria-expanded") === "true" ? true : false;
        } else {
            return false;
        }
    }


    /*
        Attributes
    */

    setOpenedAttribute() {
        const isOpen = this.getOpenedState();
        if (isOpen) {
            this.setAttribute("is-opened", "");
        } else {
            this.removeAttribute("is-opened");
        }
    }


    /*
        6. Feature Detection
    */

    /**
     * Detect if browser supports the name attribute on details elements
     * The name attribute allows multiple details elements to be grouped (only one open at a time)
     * Result is cached to run detection only once across all instances
     * @returns {boolean} True if the browser supports the name attribute on details elements
     */
    supportsDetailsName() {
        let {log} = console;

        // Return cached result if already tested
        if (this.constructor.detailsNameSupport !== null) {
            log(`name support for details elements (cached): ${this.constructor.detailsNameSupport}`);
            return this.constructor.detailsNameSupport;
        }

        // Test actual grouping behavior for same-named details elements.
        // As of May 1, 2026, this feature is missing in older browsers including
        // IE, Chrome/Edge before 120, Firefox before 130, and Safari/iOS Safari before 17.2.
        const container = document.createElement('div');
        const one = document.createElement('details');
        const two = document.createElement('details');
        const groupName = 'foundationish-details-test';

        container.hidden = true;
        one.setAttribute('name', groupName);
        two.setAttribute('name', groupName);
        one.innerHTML = '<summary>One</summary><p>One</p>';
        two.innerHTML = '<summary>Two</summary><p>Two</p>';

        container.append(one, two);
        document.body.appendChild(container);

        one.open = true;
        two.open = true;

        // If grouping is supported, opening one same-named details element closes the other,
        // so support means they should not both remain open at the same time.
        this.constructor.detailsNameSupport = !(one.open && two.open);
        container.remove();

        log(`name support for details elements: ${this.constructor.detailsNameSupport}`);
        return this.constructor.detailsNameSupport;
    }

    /* Detect details element */
    detectHTMLDetails() {
        let $details = this.querySelector("details");
        if ( $details ) {
            return !!$details;
        }
    }

    detectCustomHTML() {
        let trigger = this.querySelector("button"),
            panel = this.querySelector("button + div");
        if ( trigger && panel ) {
            return {
                trigger,
                panel
            };
        }
        return false;
    }
};

customElements.define( 'accordion-item', FoundationishAccordion );
