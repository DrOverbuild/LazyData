// Copyright (c) 2024 Jasper Reddin and contributors MIT

const ajaxActionDefaults = {
  onRequestStart: () => {},
  onRequestSuccess: () => {},
  onRequestError: () => {},
  headers: [["X-Requested-With", "XMLHttpRequest"]],
};

/**
 * @typedef AjaxActionOptions
 * @property {string} url - URL of the request
 * @property {string?} method - Method of HTTP request
 * @property {any?} body - Body of HTTP request. If defined, this will be converted to a JSON object unless the object
 *     is an instance of FormData, in which case the object itself will be passed as the body to the fetch API.
 * @property {HeadersInit?} headers - Additional headers added to request. If not set
 * @property {(() => void)?} onRequestStart - Called when the request is started. If not set, we look
 *     at the lazydata global object for global defaults. By default there is no action.
 * @property {(() => void)?} onRequestSuccess - Called when the request returns a successful response and the
 *     conversion to JSON was successful. Good opportunity to set global default UI actions without interrupting program
 *     flow for fetching data. If not set, we look at the lazydata global object for global defaults. By default there
 *     is no action.
 * @property {((string, number?) => void)?} onRequestError - Called when the request results in an error, either
 *     through an HTTP request, a non-success status code, or with an error parsing JSON. The string passed in to this
 *     function is the text content of the body of the response if the HTTP request was successful but returned a
 *     non-success HTTP status code, or the message of the JavaScript error if the HTTP request failed or conversion
 *     from JSON failed. The number passed into the function is the status code of the response. This is a good
 *     opportunity to perform error notifications in the UI before the error continues to throw. If not set, we look
 *     at the lazydata global object for global defaults. By default there is no action.
 *
 * @param {AjaxActionOptions} options
 * @return {Promise<any>} The response of the body converted from JSON to a JavaScript object if there is a response body.
 */
async function ajaxAction(options) {
  function useFallback(fn, fallbackFn, ...params) {
    if (fn && typeof fn === "function") {
      fn(...params);
    } else {
      fallbackFn(...params);
    }
  }

  if (!options.url) {
    throw new Error("options.url is required");
  }

  useFallback(options.onRequestStart, ajaxActionDefaults.onRequestStart);

  /** @type {Response | undefined} */
  let res = undefined;

  try {
    /** @type RequestInit */
    let headers = [...ajaxActionDefaults.headers, ...(options.headers ?? [])];

    const init = { method: options.method, headers };
    if (options.body) {
      if (options.body instanceof FormData) {
        init.body = options.body;
      } else {
        init.body = JSON.stringify(options.body);
        init.headers.push(["Content-Type", "application/json"]);
      }
    }

    res = await fetch(options.url, init);
    if (!res.ok) {
      const errMsg = await res.text();
      if (errMsg && errMsg.length > 0) {
        throw new Error(errMsg);
      }
      throw new Error(`AJAX request returned ${res.status}`);
    }

    useFallback(options.onRequestSuccess, ajaxActionDefaults.onRequestSuccess);

    if (res.headers.get("Content-Type")?.includes("application/json")) {
      return await res.json();
    } else {
      return await res.text();
    }
  } catch (e) {
    useFallback(options.onRequestError, ajaxActionDefaults.onRequestError, e, res?.status);
    throw e;
  }
}

class LazyData extends HTMLElement {
  constructor() {
    super();

    this._href = this.getAttribute("href");

    this._hideElementsForState("success");
    this._hideElementsForState("error");
  }

  get href() {
    console.log("get href");
    return this._href;
  }

  set href(value) {
    console.log("set href");
    this.setAttribute("href", value);
  }

  _hideElementsForState(state) {
    for (const element of this.querySelectorAll(`[lazy-data-${state}]`)) {
      element.style.display = "none";
    }
  }

  _showElementsForState(state) {
    for (const element of this.querySelectorAll(`[lazy-data-${state}]`)) {
      element.style.display = "";
    }
  }

  async _load() {
    const allowedToContinue = this.dispatchEvent(
      new CustomEvent("lazy-data:start", {
        bubbles: true,
        cancelable: true,
      }),
    );
    if (!allowedToContinue) return;

    const data = await ajaxAction({
      url: this._href,
      onRequestSuccess: () => {
        this._hideElementsForState("loading");
        this._showElementsForState("success");
      },
      onRequestStart: () => {},
      onRequestError: (e) => {
        this.dispatchEvent(
          new CustomEvent("lazy-data:error", {
            bubbles: true,
            cancelable: false,
            detail: e,
          }),
        );

        this._hideElementsForState("loading");
        this._showElementsForState("error");
      },
    });
    this._discoverDataElements(data);

    this.dispatchEvent(
      new CustomEvent("lazy-data:success", {
        bubbles: true,
        cancelable: false,
        detail: data,
      }),
    );
  }

  _discoverDataElements(data) {
    const dataElements = this.querySelectorAll("[lazy-data-id]");
    for (const dataElement of dataElements) {
      const value = this._navigateObject(data, dataElement.getAttribute("lazy-data-id"));
      if (dataElement.tagName === "img") {
        dataElement.setAttribute("src", value);
      } else {
        dataElement.innerText = value;
      }
    }
  }

  /**
   * @param {any} data
   * @param {string} identifier
   */
  _navigateObject(data, identifier) {
    const parts = identifier.split(".");
    let node = data;
    for (const part of parts) {
      node = node[part];
      if (node === undefined) {
        return undefined;
      }
    }
    return node;
  }

  static get observedAttributes() {
    return ["href"];
  }

  attributeChangedCallback(name, _, newValue) {
    if (name === "href") {
      console.log("href attribute changed");
      this._href = newValue;
      this.reload();
    }
  }

  reload() {
    this._hideElementsForState("error");
    this._hideElementsForState("success");
    this._showElementsForState("loading");

    this._load();
  }
}

customElements.define("lazy-data", LazyData);
