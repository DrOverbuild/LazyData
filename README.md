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
    [lazy-data-success] element will be hidden until after a successful request. All data loaded from the request should
    be added to any [lazy-data-success] elements to prevent them from being visible until the request has finished.
  -->
  <div lazy-data-success class="card-body">
    <p>Name: <span lazy-data-id="user.first_name"></span> <span lazy-data-id="user.last_name"></span></p>
    <p>Job: <span lazy-data-id="user.job"></span></p>
    <div>Date of Birth: <span class="date-of-birth"></span></div>
  </div>

  <!--
    [lazy-data-error] element will be shown only if request failed (either response not 200, HTTP error, or error with
    deserializing data into JSON)
  -->
  <div lazy-data-error class="card-body text-danger fst-italic">Could not fetch data. Please try again.</div>
</lazy-data>

<script>
  // Add custom rendering with given data by querying elements within target. Data from request is provided with the
  // custom event's detail object.
  document.getElementById('lazy-data-card').addEventListener('lazy-data:success', function (e) {
    const dobEl = e.target.querySelector('.date-of-birth');
    const dob = new Date(Date.parse(e.detail.user.date_of_birth));
    dobEl.innerText = dob.toLocaleDateString();
  });
</script>
```

## Custom Events

## `[lazy-data-id]` Attribute

// todo mention this affects the img src if it is an img tag. Otherwise, innerText (to be safe).

## AJAX Action
