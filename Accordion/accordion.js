customElements.define( 'accordion-item', class FoundationishAccordion extends HTMLElement {

    /**
     * Fields
     */

    openedState = false;

    attr = {
        ready: "ready",
        opened: "expanded"
    };

    panelID = false;

    // Internal flag used to distinguish event-driven attribute updates from external changes
    #attributeChangeTriggeredByEvent = false;


    // Cache for details name attribute support (runs once across all instances)
    static detailsNameSupport = null;


    // Cached detect parent accordion-items element for single-select attribute
    static singleSelectSupport = null;

    /**
     * Observer attributes
     */

    // Observe the "opened" and "is-open" attributes for changes.
    // The browser now watches for changes to this attribute and calls attributeChangedCallback() when it changes.
    static get observedAttributes() {


        return ['ready', 'expanded'];
    }

    /**
     * Watch for attribute changes
     */

    // This method is called whenever an observed attribute changes. It receives the name of the changed attribute, its old value, and its new value.
    // Fires whenever an observed attribute changes. It receives the name of the changed attribute, its old value, and its new value.
    attributeChangedCallback(attrName, oldValue, newValue) {

        if ( this.detectCustomHTML() ) {

            switch ( attrName ) {

                case 'expanded':

                    // ADDED
                    if ( newValue === '' ) {

                        // Update aria for trigger and panel
                        this.expandedAttrHandler().setAria();

                        /* Except for the target, close all disclosures */
                        if ( this.hasSingleSelectAttribute() ) {
                            this.expandedAttrHandler().closeAll();
                        }

                    // REMOVED
                    } else if ( newValue === null ) {

                        // Update aria for trigger and panel
                        this.expandedAttrHandler().setAria();

                    }

                    break;

                default:
                    break;
            }

        }

        // if ( this.detectHTMLDetails() ) {

        //     // external: removal of [expanded]
        //     if ( ( oldValue === '' && newValue === null ) && !this.#attributeChangeTriggeredByEvent ) {
        //         this.querySelector("details").open = !this.getOpenedState();
        //     }

        //     // external: addition of [expanded]
        //     else if ( ( oldValue === null && newValue === '' ) && !this.#attributeChangeTriggeredByEvent ) {
        //         this.querySelector("details").open = true;
        //     }

        // }
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

        this.supportsDetailsName();

        //this.setComponentOpenedAttribute();

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

            if (this.querySelector("details").hasAttribute("open")) {
                // this.openedState = true;
                this.setAttribute(this.attr.opened, '');
            }
        }

        // Detect provided custom markup for a disclosure pattern
        // using a button and a div
        if (
            this.detectCustomHTML()
            && !this.detectHTMLDetails()
        ) {
            this.renderCustomHTMLDisclosure();
        }

        // Event listeners for details toggle and custom disclosure click
        // this.onToggleEvent();
        this.delegateEvents();

        // Return something to detect inside init()
        return true;
    }


    /*
        4.1 Render Helpers
    */

    renderCustomHTMLDisclosure() {

        this.setAttribute("provided-markup",'');

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

    renderHTMLDetailsDisclosure() {

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

    delegateEvents() {

        /* On Click: Update WC attr to run attributeChangedCallback */
        this.addEventListener( 'click', ( event ) => {

            if ( this.hasAttribute( this.attr.opened ) ) this.removeAttribute( this.attr.opened );

            else this.setAttribute( this.attr.opened, '' );

        } );

        /* On Toggle: Update WC attr to run attributeChangedCallback */
        this.addEventListener("toggle", (event) => {

            if ( this.detectHTMLDetails() && event.target.matches("details") ) {
                // The toggle event fires after the details element has already toggled its open state, so we can directly read the new state here.
                // We just need to set the flag to indicate that any attribute changes triggered by this event should not be treated as external changes.
                this.#attributeChangeTriggeredByEvent = true;

                try {
                    this.openedState = this.getOpenedState();
                    this.setComponentOpenedAttribute();
                } finally {
                    this.#attributeChangeTriggeredByEvent = false;
                }
            }

        } );
    }

    expandedAttrHandler() {

        let setAria = (target = this.querySelector(".disclosure > button") ) => {
            let trigger = target;
            let panel = trigger.nextElementSibling;

            if ( trigger.getAttribute("aria-expanded") === "true" ) {
                trigger.setAttribute("aria-expanded", "false");
                panel.setAttribute("hidden", "");

            } else {
                trigger.setAttribute("aria-expanded", "true");
                panel.removeAttribute("hidden");
            }
        };

        let closeAll = () => {
            /* Except for the target, close all disclosures */
            let accordionItems = this.closest("accordion-items")?.querySelectorAll("accordion-item");

            if ( ! accordionItems ) return;

            [...accordionItems].forEach( item => {

                if ( item !== this ) item.removeAttribute(this.attr.opened);

            });
        }

        return {
            setAria,
            closeAll
        };

        //setAria(this.querySelector(".disclosure > button"));

    }

    onToggleEvent() {

        let { log } = console;

        /* A <details> element is provided */

        if ( this.detectHTMLDetails() ) {

            this.details = this.querySelector("details");

            if ( this.hasSingleSelectAttribute() ) {

                if ( this.supportsDetailsName() ) {

                    // If the browser supports the name attribute on details elements,
                    // we can rely on native grouping behavior.
                    // We just need to ensure that all details elements within the same
                    // accordion-items parent have the same name value.

                    const detailsElements = Array.from(
                        this.closest('accordion-items')?.querySelectorAll('accordion-item details')
                    );

                    //log(detailsElements);

                    if ( detailsElements && detailsElements.length > 0 ) {

                        let id = `fndish-details-${Math.random().toString(36).substr(2, 9)}`;
                        for (const detail of detailsElements) {
                            if ( !detail.hasAttribute('name') || detail.getAttribute('name').trim() === '' ) continue;
                            id = detail.getAttribute('name');
                            break;
                        }

                        detailsElements.forEach(detail => {
                            detail.setAttribute('name', id);
                        });
                    }

                }

                // TODO: No support for [name] then close all other details elements when one is opened, to mimic the single-select behavior.
                else {

                }
            }

            this.details.addEventListener("toggle", (event) => {
                //this.toggleHTMLDetailsHandler();

                this.#attributeChangeTriggeredByEvent = true;
                try {

                    this.openedState = this.getOpenedState();

                    // NOTE: Component attribute change occurs and calls attributeChangedCallback(),
                    //       so we can check the flag to avoid treating this as an external change...
                    this.setComponentOpenedAttribute();

                } finally {
                    // NOTE: The flag is reset after the attribute update,
                    // so that any subsequent attribute changes that are not triggered by this event will be treated as external changes.
                    this.#attributeChangeTriggeredByEvent = false;
                }
            });
        }

    }

    closeCustomHTMLDisclosure() {

        const disclosure = this.detectCustomHTML();

        if ( !disclosure ) return;

        this.#attributeChangeTriggeredByEvent = true;

        try {
            disclosure.trigger.setAttribute("aria-expanded", "false");
            disclosure.panel.setAttribute("hidden", "");
            this.removeAttribute(this.attr.opened);
        } finally {
            this.#attributeChangeTriggeredByEvent = false;
        }
    }

    _closeAllCustomHTMLDisclosures(target = event.target) {

        const accordionItems = this
            .closest("accordion-items")
            ?.querySelectorAll("accordion-item");

        if ( !accordionItems ) return;

        accordionItems.forEach( item => {

            if (
                item !== this
                && typeof item.closeCustomHTMLDisclosure === "function"
            ) {
                item.closeCustomHTMLDisclosure();
            }

        });
    }


    /*
        Handlers
    */

    // Add click event listener to the button to toggle the visibility of the panel and update ARIA attributes accordingly
    clickCustomHTMLDisclosuresHandler( target = event.target ) {

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

    getAttrState(stateName) {
        return this.getAttribute(stateName) ? true : false;
    }

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

    setComponentOpenedAttribute({add = false} = {}) {
        // console.log(add);
        // if (add) {
        //     this.setAttribute('expanded', "");
        //     return;
        // }

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
        return this.closest("accordion-items")?.hasAttribute("single-select") ?? false;
        // if (
        //     this.constructor.  === null
        //     && this.closest('accordion-items')?.hasAttribute('single-select')
        // ) {
        //     this.constructor.singleSelectParentAttribute = true;
        // }

        // return this.constructor.singleSelectParentAttribute;
    }
} );


