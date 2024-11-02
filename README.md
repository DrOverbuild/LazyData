# lazydata.js

Web component to launch an AJAX fetch to a specified URL as soon as the element is created.

## Quick Example

```html
<lazy-data id="lazy-data-card" class="card" href="https://api.slingacademy.com/v1/sample-data/users/1">
  <div class="card-header">Status</div>
  <!-- [lazy-data-loading] element will be shown until the AJAX request finishes -->
  <div lazy-data-loading class="card-body">
    <span class="placeholder col-6"></span>
  </div>

  <!--
    [lazy-data-success] element will be hidden until after a successful request. All data
    loaded from the request should be added to any [lazy-data-success] elements to prevent
    them from being visible until the request has finished.
  -->
  <div lazy-data-success class="card-body">
    <p>Name: <span lazy-data-id="user.first_name"></span> <span lazy-data-id="user.last_name"></span></p>
    <p>Job: <span lazy-data-id="user.job"></span></p>
    <div>Date of Birth: <span class="date-of-birth"></span></div>
  </div>

  <!--
    [lazy-data-error] element will be shown only if request failed (either response not
    200, HTTP error, or error with deserializing data into JSON)
  -->
  <div lazy-data-error class="card-body text-danger fst-italic">Could not fetch data. Please try again.</div>
</lazy-data>

<script>
  // Add custom rendering with given data by querying elements within target. Data from
  // request is provided with the custom event's detail object.
  document.getElementById('lazy-data-card').addEventListener('lazy-data:success', function (e) {
    const dobEl = e.target.querySelector('.date-of-birth');
    const dob = new Date(Date.parse(e.detail.user.date_of_birth));
    dobEl.innerText = dob.toLocaleDateString();
  });
</script>
```

## `[href]` Attribute

The `[href]` attribute on `<lazy-data>` sets the URL for the AJAX request. The request will use the GET method. To set
custom headers, configure `ajaxActionDefaults`. See below.

This attribute can be changed by setting the `href` property of the element or the `[href]` attribute itself. The web
component will automatically go into the loading state (displaying the elements with the `[lazy-data-loading]`
attribute and hiding `[lazy-data-success]` and `[lazy-data-error]` elements) and start the request for the new URL.

```html
<lazy-data href="..." id="lazy-data-example"></lazy-data>
<script>
  const example = document.getElementById('lazy-data-example');

  // Setting the href property. The web component automatically starts the request for the new URL.
  example.href = "...";

  // Alternatively...this does the same thing but there's more to type!
  example.setAttribute('href', '...');
</script>
```

## `[lazy-data-id]` Attribute

Use the `[lazy-data-id]` attribute within the component to identify the property of the exected response. The element
to which this attribute is added will have its `innerText` set to the given property. Use dot notation to select a
property within an object.

For example, if the response looks like this:

```json
{
  "user": {
    "id": 1
    ...
  }
  ...
}
```

Any element with the attribute `lazy-data-id="user.id"` will get its `innerText` set to `1`.

## Custom Events

LazyData dispatches three events:

`lazy-data:success` is dispatched when the data loads successfully. This event is not cancellable. The detail object of
the event is set to the deserialized JSON data of the response (or text data if the response was not in JSON format).
Use this event to render the data within the component that cannot be rendered with the `lazy-data-id` attribute.

`lazy-data:start` is dispatched before the data is fetched before the component moves to the loading state and the
request is sent. This event is cancellable. If cancelled, the component remains in the current state and no request is
made.

`lazy-data:error` is dispatched when the request results in an error state. This can happen if the HTTP connection fails
to be established, the response status code is not OK, or an error happens deserializing the data. The event is not
cancellable. The detail of the event is the error message generated by the request.

## AJAX Action

The web component uses a wrapper for `fetch()` that is available to use and offers configurable global defaults.

### Usage

`async function ajaxAction(options)`

#### `options`

| Property | Type | Default Value | Description |
| `url` | `string` | | URL of the request. |
| `method` | `string` | Default for `fetch()` (`get`) | Method of the request. |
| `body` | `any?` | | Body of the HTTP request converted to a JSON object. |
| `headers` | `HeadersInit?` | | Additional headers. All headers specified here are combined with `ajaxActionDefaults.headers`. |
| `onRequestStart` | `() => void` | `ajaxActionDefaults.onRequestStart` | Called when request begins. Use this to update loading state UI, such as a toast to indicate data is loading. |
| `onRequestSuccess` | `() => void` | `ajaxActionDefaults.onRequestSuccess` | Called when request completes with a successful response. Use this to update loading state UI. Do not use to render data from request. |
| `onRequestError` | `(string, number?) => void` | `ajaxActionDefaults.onRequestError` | Called when the HTTP request fails, the response returns without an OK status code, or JSON deserialization fails. The first argument is the error message. The second argument is the request status code if available. Use to update loading state. |

#### Throws

Whenever the HTTP request fails, the response returns a status that is not OK, or deserializing JSON fails. The error is
thrown even if `options.onRequestError` is set.

#### Returns

A promise containing the deserialized JSON response if the response contains the header
`Content-Type: application/json`. Otherwise, a string with response text.

### AJAX Action Defaults

Update the global `ajaxActionDefaults` object to configure defaults.

| Property Name | Type | Description |
|---------------|------|-------------|
| `onRequestStart` | `() => {}` | Called when request begins. Use this to update loading state UI, such as a toast to indicate data is loading. |
| `onRequestSuccess` | `() => {}` | Called when request completes with a successful response. Use this to update loading state UI. Do not use to render data from request. |
| `onRequestError` | `(string, number?) => {}` | Called when the HTTP request fails, the response returns without an OK status code, or JSON deserialization fails. The first argument is the error message. The second argument is the request status code if available. Use to update loading state. It may be good practice to globally refresh the page if this method is called with a 401 or 403 response code. |
| `headers` | `HeadersInit` | Global headers to add to all requests. |

`ajaxActionDefaults.headers` automatically includes `X-Requested-With: XMLHttpRequest` in order to work with ASP.NET
Core applications that have different behaviors handling AJAX requests compared to standard GET requests.
