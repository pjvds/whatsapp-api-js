import { Document, Image, Video } from "./media";
import Text from "./text";

/**
 * Interactive API object
 *
 * @property {(ActionList|ActionButtons|ActionCatalog)} action The action component of the interactive message
 * @property {"list"|"button"|"product"|"product_list"} type The type of the interactive message
 * @property {Body} [body] The body component of the interactive message
 * @property {Header} [header] The header component of the interactive message
 * @property {Footer} [footer] The footer component of the interactive message
 * @property {"interactive"} [_] The type of the interactive message, for internal use only
 */
export class Interactive {
    action: ActionList | ActionButtons | ActionCatalog;
    type: "list" | "button" | "product" | "product_list";
    body?: Body;
    header?: Header;
    footer?: Footer;
    _?: "interactive";

    /**
     * Create an Interactive object for the API
     *
     * @param {(ActionList|ActionButtons|ActionCatalog)} action The action component of the interactive message
     * @param {Body} [body] The body component of the interactive message
     * @param {Header} [header] The header component of the interactive message
     * @param {Footer} [footer] The footer component of the interactive message
     * @throws {Error} If action is not provided
     * @throws {Error} If body is not provided, unless action is an ActionCatalog with a single product
     * @throws {Error} If header is provided for an ActionCatalog with a single product
     * @throws {Error} If header of type Text is not provided for an ActionCatalog with a product list
     * @throws {Error} If header is not of type text, unless action is an ActionButtons
     */
    constructor(
        action: ActionList | ActionButtons | ActionCatalog,
        body: Body,
        header: Header,
        footer: Footer
    ) {
        if (!action)
            throw new Error("Interactive must have an action component");

        if (!action._) {
            throw new Error(
                "Unexpected internal error (action._ is not defined)"
            );
        }

        if (action._ !== "product" && !body)
            throw new Error("Interactive must have a body component");
        if (action._ === "product" && header)
            throw new Error(
                "Interactive must not have a header component if action is a single product"
            );
        if (action._ === "product_list" && header?.type !== "text")
            throw new Error(
                "Interactive must have a Text header component if action is a product list"
            );
        if (header && action._ !== "button" && header?.type !== "text")
            throw new Error("Interactive header must be of type Text");

        this.type = action._;
        delete action._;

        this.action = action;
        if (body) this.body = body;
        if (header) this.header = header;
        if (footer) this.footer = footer;

        this._ = "interactive";
    }
}

/**
 * Body API object
 *
 * @property {string} text The text of the body
 */
export class Body {
    text: string;

    /**
     * Builds a body component for an Interactive message
     *
     * @param {string} text The text of the message. Maximum length: 1024 characters.
     * @throws {Error} If text is not provided
     * @throws {Error} If text is over 1024 characters
     */
    constructor(text: string) {
        if (!text) throw new Error("Body must have a text object");
        if (text.length > 1024)
            throw new Error("Body text must be less than 1024 characters");

        this.text = text;
    }
}

/**
 * Footer API object
 *
 * @property {string} text The text of the footer
 */
export class Footer {
    text: string;

    /**
     * Builds a footer component for an Interactive message
     *
     * @param {string} text Text of the footer. Maximum length: 60 characters.
     * @throws {Error} If text is not provided
     * @throws {Error} If text is over 60 characters
     */
    constructor(text: string) {
        if (!text) throw new Error("Footer must have a text object");
        if (text.length > 60)
            throw new Error("Footer text must be 60 characters or less");

        this.text = text;
    }
}

/**
 * Header API object
 *
 * @property {"text"|"video"|"image"|"document"} type The type of the header
 * @property {string} [text] The text of the parameter
 * @property {Image} [image] The image of the parameter
 * @property {Document} [document] The document of the parameter
 * @property {Video} [video] The video of the parameter
 */
export class Header {
    type: "text" | "video" | "image" | "document";
    text?: string;
    image?: Image;
    document?: Document;
    video?: Video;

    /**
     * Builds a header component for an Interactive message
     *
     * @param {(Document|Image|Text|Video)} object The message object for the header
     * @throws {Error} If object is not provided
     * @throws {Error} If object is not a Document, Image, Text, or Video
     * @throws {Error} If object is a Text and is over 60 characters
     * @throws {Error} If object is a Media and has a caption
     */
    constructor(object: Document | Image | Text | Video) {
        if (!object) throw new Error("Header must have an object");
        if (!object._) {
            throw new Error(
                "Unexpected internal error (object._ is not defined)"
            );
        }

        if (!["text", "video", "image", "document"].includes(object._))
            throw new Error(
                "Header object must be either Text, Video, Image or Document."
            );

        this.type = object._;

        // Text type can go to hell
        if (object instanceof Text) {
            if (object.body.length > 60)
                throw new Error("Header text must be 60 characters or less");
            this[object._] = object.body;
        } else {
            delete object._;

            // Now I think about it, all interactive can go to hell too
            if (Object.prototype.hasOwnProperty.call(object, "caption"))
                throw new Error(`Header ${this.type} must not have a caption`);

            // @ts-ignore - TS dumb, the _ will always match the type
            this[this.type] = object;
        }
    }
}

/**
 * Action API object
 *
 * @property {Array<Button>} buttons The buttons of the action
 * @property {"button"} [_] The type of the action, for internal use only
 */
export class ActionButtons {
    buttons: Button[];
    _?: "button";

    /**
     * Builds a reply buttons component for an Interactive message
     *
     * @param {...Button} button Buttons to be used in the reply buttons. Each button title must be unique within the message. Emojis are supported, markdown is not. Must be between 1 and 3 buttons.
     * @throws {Error} If no buttons are provided or are over 3
     * @throws {Error} If two or more buttons have the same id
     * @throws {Error} If two or more buttons have the same title
     */
    constructor(...button: Button[]) {
        if (!button.length || button.length > 3)
            throw new Error("Reply buttons must have between 1 and 3 buttons");

        // Find if there are duplicates in button.id
        const ids = button.map((b) => b[b.type].id);
        if (ids.length !== new Set(ids).size)
            throw new Error("Reply buttons must have unique ids");

        // Find if there are duplicates in button.title
        const titles = button.map((b) => b[b.type].title);
        if (titles.length !== new Set(titles).size)
            throw new Error("Reply buttons must have unique titles");

        this.buttons = button;
        this._ = "button";
    }
}

/**
 * Button API object
 *
 * @property {"reply"} type The type of the button
 * @property {string} reply.id The id of the row
 * @property {string} reply.title The title of the row
 */
export class Button {
    type: "reply";
    reply: {
        id: string;
        title: string;
    };

    /**
     * Builds a button component for ActionButtons
     *
     * @param {string} id Unique identifier for your button. It cannot have leading or trailing spaces. This ID is returned in the webhook when the button is clicked by the user. Maximum length: 256 characters.
     * @param {string} title Button title. It cannot be an empty string and must be unique within the message. Emojis are supported, markdown is not. Maximum length: 20 characters.
     * @throws {Error} If id is not provided
     * @throws {Error} If id is over 256 characters
     * @throws {Error} If id is malformed
     * @throws {Error} If title is not provided
     * @throws {Error} If title is over 20 characters
     */
    constructor(id: string, title: string) {
        if (!id) throw new Error("Button must have an id");
        if (id.length > 256)
            throw new Error("Button id must be 256 characters or less");
        if (/^ | $/.test(id))
            throw new Error("Button id cannot have leading or trailing spaces");
        if (!title) throw new Error("Button must have a title");
        if (title.length > 20)
            throw new Error("Button title must be 20 characters or less");

        this.type = "reply";
        this.reply = {
            title,
            id
        };
    }
}

/**
 * Action API object
 *
 * @property {string} button The button text
 * @property {Array<ListSection>} sections The sections of the action
 * @property {"list"} [_] The type of the action, for internal use only
 */
export class ActionList {
    button: string;
    sections: ListSection[];
    _?: "list";

    /**
     * Builds an action component for an Interactive message
     * Required if interactive type is "list"
     *
     * @param {string} button Button content. It cannot be an empty string and must be unique within the message. Emojis are supported, markdown is not. Maximum length: 20 characters.
     * @param  {...ListSection} sections Sections of the list
     * @throws {Error} If button is not provided
     * @throws {Error} If button is over 20 characters
     * @throws {Error} If no sections are provided or are over 10
     * @throws {Error} If more than 1 section is provided and at least one doesn't have a title
     */
    constructor(button: string, ...sections: ListSection[]) {
        if (!button) throw new Error("Action must have a button content");
        if (button.length > 20)
            throw new Error("Button content must be 20 characters or less");
        if (!sections.length || sections.length > 10)
            throw new Error("Action must have between 1 and 10 sections");
        if (
            sections.length > 1 &&
            !sections.every((obj) =>
                Object.prototype.hasOwnProperty.call(obj, "title")
            )
        )
            throw new Error(
                "All sections must have a title if more than 1 section is provided"
            );

        this._ = "list";
        this.button = button;
        this.sections = sections;
    }
}

/**
 * Section API object
 *
 * @property {Array<Row>} rows The rows of the section
 * @property {string} [title] The title of the section
 */
export class ListSection {
    rows: Row[];
    title?: string;

    /**
     * Builds a section component for ActionList
     *
     * @param {string} title Title of the section, only required if there are more than one section
     * @param {...Row} rows Rows of the section
     * @throws {Error} If title is over 24 characters if provided
     * @throws {Error} If no rows are provided or are over 10
     */
    constructor(title: string, ...rows: Row[]) {
        if (title && title.length > 24)
            throw new Error("Section title must be 24 characters or less");
        if (!rows.length || rows.length > 10)
            throw new Error("Section must have between 1 and 10 rows");

        if (title) this.title = title;
        this.rows = rows;
    }
}

/**
 * Row API object
 *
 * @property {string} id The id of the row
 * @property {string} title The title of the row
 * @property {string} [description] The description of the row
 */
export class Row {
    id: string;
    title: string;
    description?: string;

    /**
     * Builds a row component for a Section
     *
     * @param {string} id The id of the row. Maximum length: 200 characters.
     * @param {string} title The title of the row. Maximum length: 24 characters.
     * @param {string} [description] The description of the row. Maximum length: 72 characters.
     * @throws {Error} If id is not provided
     * @throws {Error} If id is over 200 characters
     * @throws {Error} If title is not provided
     * @throws {Error} If title is over 24 characters
     * @throws {Error} If description is over 72 characters
     */
    constructor(id: string, title: string, description: string) {
        if (!id) throw new Error("Row must have an id");
        if (id.length > 200)
            throw new Error("Row id must be 200 characters or less");
        if (!title) throw new Error("Row must have a title");
        if (title.length > 24)
            throw new Error("Row title must be 24 characters or less");
        if (description && description.length > 72)
            throw new Error("Row description must be 72 characters or less");

        this.id = id;
        this.title = title;
        if (description) this.description = description;
    }
}

/**
 * Action API object
 *
 * @property {string} catalog_id The id of the catalog from where to get the products
 * @property {string} [product_retailer_id] The product to be added to the catalog
 * @property {Array<ProductSection>} [sections] The section to be added to the catalog
 * @property {("product"|"product_list")} [_] The type of the action, for internal use only
 */
export class ActionCatalog {
    catalog_id: string;
    product_retailer_id?: string;
    sections?: ProductSection[];
    _?: "product" | "product_list";

    /**
     * Builds a catalog component for an Interactive message
     *
     * @param {string} catalog_id The catalog id
     * @param {...(Product|ProductSection)} products The products to add to the catalog
     * @throws {Error} If catalog_id is not provided
     * @throws {Error} If products is not provided
     * @throws {Error} If products is a single product and more than 1 product is provided
     * @throws {Error} If products is a product list and more than 10 sections are provided
     * @throws {Error} If products is a product list with more than 1 section and at least one section is missing a title
     */
    constructor(catalog_id: string, ...products: (Product | ProductSection)[]) {
        if (!catalog_id) throw new Error("Catalog must have a catalog id");
        if (!products.length)
            throw new Error(
                "Catalog must have at least one product or product section"
            );

        // TypeScript doesn't support type guards in array destructuring
        const first_product = products[0];
        const is_single_product = first_product instanceof Product;

        if (is_single_product && products.length > 1)
            throw new Error(
                "Catalog must have only 1 product, use a ProductSection instead"
            );
        else {
            if (products.length > 10)
                throw new Error(
                    "Catalog must have between 1 and 10 product sections"
                );
            if (products.length > 1) {
                for (const obj of products) {
                    if (!(obj instanceof ProductSection)) {
                        throw new Error(
                            "Catalog must have only ProductSection objects"
                        );
                    }

                    if (!Object.prototype.hasOwnProperty.call(obj, "title")) {
                        throw new Error(
                            "All sections must have a title if more than 1 section is provided"
                        );
                    }
                }
            }
        }

        this.catalog_id = catalog_id;

        if (is_single_product)
            this.product_retailer_id = first_product.product_retailer_id;
        // @ts-ignore - TS doesn't know that if it's not a single product, it's a product list
        else this.sections = products;

        this._ = is_single_product ? "product" : "product_list";
    }
}

/**
 * Section API object
 *
 * @property {string} [title] The title of the section
 * @property {Array<Product>} product_items The products of the section
 */
export class ProductSection {
    title?: string;
    product_items: Product[];

    /**
     * Builds a product section component for an ActionCatalog
     *
     * @param {string} title The title of the product section, only required if more than 1 section will be used
     * @param {...Product} products The products to add to the product section
     * @throws {Error} If title is over 24 characters if provided
     * @throws {Error} If no products are provided or are over 30
     */
    constructor(title: string, ...products: Product[]) {
        if (title && title.length > 24)
            throw new Error("Section title must be 24 characters or less");
        if (!products.length || products.length > 30)
            throw new Error("Section must have between 1 and 30 products");

        if (title) this.title = title;
        this.product_items = products;
    }
}

/**
 * Product API object
 *
 * @property {string} product_retailer_id The id of the product
 */
export class Product {
    product_retailer_id: string;

    /**
     * Builds a product component for ActionCart and ProductSection
     *
     * @param {string} product_retailer_id The id of the product
     * @throws {Error} If product_retailer_id is not provided
     */
    constructor(product_retailer_id: string) {
        if (!product_retailer_id)
            throw new Error("Product must have a product_retailer_id");
        this.product_retailer_id = product_retailer_id;
    }
}
