<script>
    let definedOwner = 'SMC';
    let customOwner;

    export let name;
    export let owner = customOwner || definedOwner;
    export let barcode;

    if (owner === 'SMC' || owner === 'ART') {
        definedOwner = owner;
    } else {
        customOwner = owner;
    }

    $: owner = definedOwner || customOwner;
  </script>
  
  <style>
    .form-container {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
  
    .input-field {
      padding: 0.5rem;
      font-size: 1rem;
    }
  
    .radio-group {
      display: flex;
      gap: 1rem;
    }
  
    .custom-owner {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
  </style>
  
  <div class="form-container">
    <input
      class="input-field"
      type="text"
      bind:value={name}
      placeholder="Item Name"
    />
  
    <input
      class="input-field"
      type="text"
      bind:value={barcode}
      placeholder="Barcode Number"
    />
  
    <div class="radio-group">
      <label>
        <input type="radio" bind:group={definedOwner} value="SMC"/>
        SMC
      </label>
  
      <label>
        <input type="radio" bind:group={definedOwner} value="ART"/>
        ART
      </label>
  
      <label>
        <input type="radio" bind:group={definedOwner} value=""/>
        Custom
      </label>
    </div>
  
    {#if definedOwner === ""}
      <div class="custom-owner">
        <input
          class="input-field"
          type="text"
          bind:value={customOwner}
          placeholder="Owner"
        />
      </div>
    {/if}
  </div>