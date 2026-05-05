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

    /**
     * Done! I've updated the method to cache the result:

Added a static property detailsNameSupport to store the cached result across all instances
Modified supportsDetailsName() to check if the test has already run — if so, it returns the cached value immediately
Only on the first call does it perform the actual detection test
Now when you have 3 instances of the accordion element, the feature detection only runs once, and subsequent instances reuse the cached result.


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
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'is-opened') {
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

        this.onToggleEvent();

        this.supportsDetailsName();

        // Return something to detect inside init()
        return true;
    }

    /**
     *  4. Render
     */

    render() {

        // Return something to detect inside init()
        return true;
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
        this.details = this.querySelector("details");

        if (!this.details) return false;

        this.openedState = this.getOpenedState();
        this.setOpenedAttribute();

        this.details.addEventListener("toggle", (event) => {
            this.setAttribute("toggle-count", ++this.toggleCount);
            this.openedState = this.getOpenedState();
            this.setOpenedAttribute();
            console.log("Current opened state:", this.openedState);
        });
    }

    /*
        5. State
    */

    getOpenedState() {
        return this.querySelector("details").hasAttribute("open") ? true : false;
    }

    setOpenedAttribute() {
        const isOpen = this.getOpenedState();
        const isOpenAttr = this.getAttribute("is-opened");
        if (isOpen) {
            this.setAttribute("is-opened", `${this.toggleCount/2}`);
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
};

customElements.define( 'accordion-item', FoundationishAccordion );
