class FoundationishAccordion extends HTMLElement {

    /**
     * Fields
     */

    openedState = false;

    toggleCount = 0;

    attr = {
        ready: "ready",
        opened: "expanded"
    };

    panelID = false;

    // Internal flag used to distinguish event-driven attribute updates from external changes
    #attributeChangeTriggeredByEvent = false;

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


    // Cached detect parent accordion-items element for single-select attribute
    static singleSelectParentAttribute = null;


    /**
     * Observer attributes
     */

    // Observe the "opened" and "is-open" attributes for changes.
    // The browser now watches for changes to this attribute and calls attributeChangedCallback() when it changes.
    static get observedAttributes() {

        // TODO: this.attr to array and loop through it here.
        return ['expanded', 'is-opened'];
    }

    /**
     * Watch for attribute changes
     */

    // This method is called whenever an observed attribute changes. It receives the name of the changed attribute, its old value, and its new value.
    // Fires whenever an observed attribute changes. It receives the name of the changed attribute, its old value, and its new value.
    attributeChangedCallback(attrName, oldValue, newValue) {
        if ( attrName === 'expanded' && this.detectCustomHTML() ) {

            if ( ( oldValue === '' && newValue === null ) && !this.#attributeChangeTriggeredByEvent ) {

                this.clickCustomHTMLDisclosuresHandler(this.querySelector(".disclosure > button"));
                console.log('This attribute change was caused externally.');

            } else if (!this.#attributeChangeTriggeredByEvent) {

                this.clickCustomHTMLDisclosuresHandler(this.querySelector(".disclosure > button"));
                console.log('This attribute change was caused externally.');

            }

        } else if ( attrName === 'expanded' && this.detectHTMLDetails() ) {

            // removal of [expanded]
            if ( ( oldValue === '' && newValue === null ) && !this.#attributeChangeTriggeredByEvent ) {
                this.querySelector("details").open = !this.getOpenedState();
            }

            // addition of [expanded]
            else if (!this.#attributeChangeTriggeredByEvent) {
                this.querySelector("details").open = !this.getOpenedState();
            }

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
        let { log } = console;

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
            this.renderCustomHTMLDisclosure();
        }

        // Event listeners for details toggle and custom disclosure click
        this.onToggleEvent();

        // Return something to detect inside init()
        return true;
    }


    /*
        4.1 Render Helpers
    */

    renderCustomHTMLDisclosure() {

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
            wrapper.setAttribute("role", "group");

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

            if (trigger.getAttribute("aria-expanded") === "false") {
                panel.setAttribute("hidden", "");
            } else {
                panel.removeAttribute("hidden");
            }
        }

        setWrapperForDisclosure();

        setAttsForDisclosure();

        // addWiringForDisclosure();
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

        let { log } = console;

        /* A <details> element is provided */

        if ( this.detectHTMLDetails() ) {
            this.details = this.querySelector("details");

            this.details.addEventListener("toggle", (event) => {
                //this.toggleHTMLDetailsHandler();

                this.#attributeChangeTriggeredByEvent = true;
                try {

                    this.openedState = this.getOpenedState();

                    // NOTE: Component attribute change occurs and calls attributeChangedCallback(),
                    //       so we can check the flag to avoid treating this as an external change...
                    this.setOpenedAttribute();

                } finally {
                    // NOTE: The flag is reset after the attribute update,
                    // so that any subsequent attribute changes that are not triggered by this event will be treated as external changes.
                    this.#attributeChangeTriggeredByEvent = false;
                }
            });
        }

        /* Custom HTML is provided */

        if ( this.detectCustomHTML() ) {

            this.detectCustomHTML().trigger.addEventListener("click", (event) => {

                this.#attributeChangeTriggeredByEvent = true;

                if (this.hasSingleSelectAttribute()) {

                    this._closeAllCustomHTMLDisclosures();

                    // TODO: allow for closing of a single open item if clicking on its trigger a close/collapse action (currently requires clicking on another item to close)
                }

                try {
                    // Expand or collapse
                    this.clickCustomHTMLDisclosuresHandler(event.target);

                    // Get 'opened' state with getOpenedState()
                    // Update the 'opened' attribute with setOpenedAttribute()
                    this.setOpenedAttribute();
                } finally {

                    this.#attributeChangeTriggeredByEvent = false;

                }
            });
        }
    }

    _closeAllCustomHTMLDisclosures(target = event.target) {

        const triggers = this.closest('accordion-items')?.querySelectorAll('accordion-item .disclosure > button[aria-expanded="true"]');

        if ( triggers ) {

            Array.from(triggers).forEach( button => {

                if ( target === button ) return;

                button.setAttribute("aria-expanded", "false");

                const panel = button.nextElementSibling;
                if (panel) {
                    panel.setAttribute("hidden", "");
                }

                //button.closest('accordion-item').removeAttribute('expanded');

            });

        }
    }


    /*
        Handlers
    */

    // Add click event listener to the button to toggle the visibility of the panel and update ARIA attributes accordingly
    clickCustomHTMLDisclosuresHandler(target = event.target) {
        console.log(target);

        let trigger = target;
        let panel = trigger.nextElementSibling;
        if ( trigger.getAttribute("aria-expanded") === "true" ) {
            trigger.setAttribute("aria-expanded", "false");
            panel.setAttribute("hidden", "");

        } else {
            trigger.setAttribute("aria-expanded", "true");
            panel.removeAttribute("hidden");
        }
    }

    toggleHTMLDetailsHandler() {
        /* Native HTML element */
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
            this.setAttribute('expanded', "");
        } else {
            this.removeAttribute('expanded');
        }
    }

    /*
        6. Detection
    */

    /**
     * Detect if browser supports the name attribute on details elements
     * The name attribute allows multiple details elements to be grouped (only one open at a time)
     * Result is cached to run detection only once across all instances
     * @returns {boolean} True if the browser supports the name attribute on details elements
     */
    supportsDetailsName() {
        let {log} = console;

        // Run once and cache the result in a static property on the class
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

    /* NOTE: for <accordion-items /> */
    hasSingleSelectAttribute() {
        if (
            this.constructor.singleSelectParentAttribute === null
            && this.closest('accordion-items')?.hasAttribute('single-select')
        ) {
            this.constructor.singleSelectParentAttribute = true;
        }

        return this.constructor.singleSelectParentAttribute;
    }
};

customElements.define( 'accordion-item', FoundationishAccordion );
