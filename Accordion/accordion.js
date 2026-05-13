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

        if ( this.detectHTMLDetails() ) {

            switch ( attrName ) {

                case 'expanded':

                    // ADDED
                    if ( newValue === '' ) {

                        // let openAttr = this.querySelector('details').hasAttribute('open');
                        // if ( ! openAttr ) this.querySelector('details').setAttribute('open', '');

                         /* Except for the target, close all disclosures */
                        if ( this.hasSingleSelectAttribute() ) {
                            this.expandedAttrHandler().closeAll();
                        }

                        console.log(`this.attributeChangeTriggeredByEvent: ${this.#attributeChangeTriggeredByEvent}`);


                    // REMOVED
                    } else if ( newValue === null ) {

                        // let openAttr = this.querySelector('details').hasAttribute('open');
                        // if ( openAttr ) this.querySelector('details').removeAttribute('open');

                        console.log(`this.attributeChangeTriggeredByEvent: ${this.#attributeChangeTriggeredByEvent}`);

                    }

                    break;

                default:
                    break;
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

        //this.setComponentOpenedAttribute();

        // Return something to detect inside init()
        return true;
    }


    /**
     *  4. Render
     */

    render() {
        let { log } = console;

        // Detect provided custom markup for a disclosure pattern
        // using a button and a div
        if ( this.detectCustomHTML() ) {
            this.setAttribute('type','custom');
            this.#renderCustomHTMLDisclosure().setWrapperForDisclosure();
            this.#renderCustomHTMLDisclosure().setAttsForDisclosure();
        }

        // Detect 'details' element
        if ( this.detectHTMLDetails() ) {
            this.setAttribute('type','details');
            this.supportsDetailsName();
            this.#renderHTMLDetailsDisclosure();
        }


        // Event listeners for details toggle and custom disclosure click
        // this.onToggleEvent();
        this.delegateEvents();

        // Return something to detect inside init()
        return true;
    }

    #renderCustomHTMLDisclosure() {

        // Generate a unique ID for the panel if it doesn't already have one
        let _generateUniqueID = () => {
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
        let setAttsForDisclosure = ( button, content ) => {
            let trigger = button || this.querySelector(".disclosure > button"),
                panel = content || this.querySelector(".disclosure > div");

            if (!panel.id) {
                this.panelID = _generateUniqueID();
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

        return {
            setWrapperForDisclosure,
            setAttsForDisclosure
        }

        //setWrapperForDisclosure();

        //setAttsForDisclosure();

        // addWiringForDisclosure();
    }

    #renderHTMLDetailsDisclosure() {

        if ( this.querySelector('details').hasAttribute('open') ) {
            this.setAttribute('expanded', '');
        }

        if ( this.hasAttribute('expanded') ) {
            this.querySelector('details').setAttribute('open', '');
        }


        /*
            Add the name attr and the same value for each to enable expansion of one disclosre at a time

            NOTE:
                If the browser supports the name attribute on details elements, we can rely on
                native grouping behavior. We just need to ensure that all details elements within
                the same accordion-items parent have the same name value.
        */

        if ( this.hasSingleSelectAttribute() ) {

            if ( this.supportsDetailsName() ) {

                const detailsElements = Array.from(
                    this.closest('accordion-items')?.querySelectorAll('accordion-item details')
                );

                if ( detailsElements && detailsElements.length > 0 ) {

                    let id = `fndish-details-${Math.random().toString(36).substr(2, 9)}`;

                    for ( const detail of detailsElements ) {

                        // Skip element if there is no name attr or the value is empty.
                        if (
                            ! detail.hasAttribute( 'name' )
                            || detail.getAttribute( 'name' ).trim() === ''
                        ) continue;

                        // Use the value of the first element with a name attr.
                        id = detail.getAttribute('name');
                        break;

                    }

                    detailsElements.forEach( detail => {
                        detail.setAttribute( 'name', id );
                    });
                }

            }

            // TODO: No support for [name] then close all other details elements when one is opened, to mimic the single-select behavior.
            else {

            }
        }
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
            this.#attributeChangeTriggeredByEvent = true;

            if ( this.hasAttribute( this.attr.opened ) ) this.removeAttribute( this.attr.opened );

            else this.setAttribute( this.attr.opened, '' );

        } );
    }


    /*
        Handlers
    */

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

            let accordionItems = this.closest("accordion-items")?.querySelectorAll("accordion-item");

            if ( ! accordionItems ) return;

            [...accordionItems].forEach( item => {

                // Except for the target, close all disclosures
                if ( item !== this ) item.removeAttribute(this.attr.opened);

            } );
        }

        return {
            setAria,
            closeAll
        };

    }



    /*
        State
    */

    getStateFromAttr( attrName ) {
        return this.getAttribute( attrName ) ? true : false;
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



    /*
        Detection
    */

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

    hasSingleSelectAttribute() {
        return this.closest("accordion-items")?.hasAttribute("single-select") ?? false;
    }

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

} );


