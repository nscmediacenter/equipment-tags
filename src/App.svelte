<script>
    import JsBarcode from 'jsbarcode';
	import ListItem from './ListItem.svelte';

	import Icon from 'mdi-svelte';
	import { mdiClose, mdiContentCopy, mdiPlus, mdiFileDocumentCheck, mdiEraser, mdiCodeTags } from '@mdi/js';

	let dpi = 300;

	let savedItems = localStorage.getItem('itemList');

	let items = [];

	if (savedItems) items = JSON.parse(savedItems);

	let popupVisible = false;
	let advancedInput = "";

	let imageUrl = '';

	function saveItemList() {
		if (items.length > 0) {
			localStorage.setItem('itemList', JSON.stringify(items));
		} else {
			localStorage.removeItem('itemList');
		}
	}

	function newItem() {
		items = [...items, { name: '', barcode: '', owner: '' }];
		saveItemList();
	}

	function confirmClear() {
		if (confirm("Clear the item list?")) clearItems();
	}

	function clearItems() {
		items = [];
		saveItemList();
	}

	const logoImage = new Image();
	logoImage.src = 'assets/logo_white.png';

	function removeItem(value) {
		items = items.filter(item => item !== value)
		saveItemList();
	}

	function cloneItem(value) {
		const index = items.indexOf(value);
		const copy = {...value};
		items.splice(index, 0, copy);
		items = items; // hack to make Svelte recognize something has changed
		saveItemList();
	}

    function formatBarcodeText(value) {
        if (value.length < 9) return value;
        return `${value[0]} ${value.slice(1, 4)} ${value.slice(4, 6)} ${value.slice(6, -3)}${value.slice(-3)}`;
    }

    function generateBarcode(barcodeValue) {
        if (barcodeValue.trim() !== '') {
            const barcodeCanvas = document.createElement('canvas');
            JsBarcode(barcodeCanvas, barcodeValue, {
                format: "CODE128",
                displayValue: false,
                height: 70,
                width: 4,
                margin: 10,
                background: "#ffffff",
            });

			const barcodeHeight = barcodeCanvas.height;
			const extraSpace = 80;
			const canvas = document.createElement('canvas');
			canvas.width = barcodeCanvas.width;
			canvas.height = barcodeHeight + extraSpace;

            const ctx = canvas.getContext('2d');
			ctx.drawImage(barcodeCanvas, 0, 0);
            ctx.font = "bold 42px 'Roboto Mono', monospace";

            const formattedText = formatBarcodeText(barcodeValue);
			const fullTextWidth = ctx.measureText(formattedText).width;
			const leftMargin = (canvas.width - fullTextWidth) / 2;

            ctx.fillStyle = "black";
            ctx.fillText(formattedText.slice(0, -3), leftMargin, canvas.height - (extraSpace / 2));

            ctx.fillStyle = "red";
            ctx.fillText(formattedText.slice(-3), ctx.measureText(formattedText.slice(0, -3)).width + leftMargin, canvas.height - (extraSpace / 2));

            return canvas;
        }
    }

	function generateTag(item) {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		canvas.width = 2.75 * dpi;
		canvas.height = 1.75 * dpi;

		let barcodeImage = generateBarcode(item.barcode);
		ctx.drawImage(barcodeImage, 0.2 * dpi, 0.9 * dpi);

		ctx.fillStyle = '#487ABE';
		ctx.lineWidth = 0;
		ctx.fillRect(0, 0, 2.75 * dpi, 0.67 * dpi);

		ctx.drawImage(logoImage, 0.5 * dpi, 0.26 * dpi, 1.6 * dpi, 0.4 * dpi);

		///
		// ctx.fillStyle = 'black';
		// ctx.lineWidth = 4;
		// ctx.globalAlpha = 0.1;
		// ctx.fillRect(0.125 * dpi, 0.25 * dpi, 2.385 * dpi, 1.25 * dpi);
		///
		ctx.globalAlpha = 1;
		ctx.fillStyle = 'black';
		
		let nameFontSize = 52;
		ctx.font = `bold ${nameFontSize}px Arial`;

		let nameWidth = ctx.measureText(item.name).width;

		while (nameWidth > 2.325 * dpi) {
			nameFontSize -= 2
			ctx.font = `bold ${nameFontSize}px Arial`;
			nameWidth = ctx.measureText(item.name).width;
		}

		ctx.fillText(item.name, (0.15 * dpi) + ((2.325 * dpi) - nameWidth) / 2, 0.865 * dpi);

		ctx.font = "bold 42px Arial";
		ctx.fillText('Owner:', 1.875 * dpi + 4, 1.0625 * dpi);

		let ownerFontSize = 38;
		ctx.font = `${ownerFontSize}px Arial`;
		
		let ownerWidth = ctx.measureText(item.owner).width;

		while (ownerWidth > 0.5 * dpi) {
			ownerFontSize -= 2
			ctx.font = `${ownerFontSize}px Arial`;
			ownerWidth = ctx.measureText(item.owner).width;
		};

		ctx.fillText(item.owner, (1.875 * dpi) + ((0.5 * dpi) - ownerWidth) / 2, 1.2 * dpi);

		return canvas;

	}

	function generatePrint() {
		localStorage.setItem('itemList', JSON.stringify(items));

		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		canvas.width = 11 * dpi;
		canvas.height = 8.5 * dpi;

		ctx.fillStyle = 'white';
		ctx.fillRect(0,0,11 * dpi, 8.5*dpi);

		let n = 0;

		let x = 0.25 * dpi;
		let y = 0.25 * dpi;

		ctx.strokeStyle = 'black';
		ctx.lineWidth = 1;

		let numExcluded = 0;

		items.forEach((item) => {
			if (!item.name || !item.barcode || !item.owner) {
				numExcluded += 1;
				return;
			}

			ctx.strokeRect(x, y, 2.75 * dpi, 1.75 * dpi);
			ctx.drawImage(generateTag(item), x, y);

			n += 1;
			if (n % 3 == 0) {
				x = 0.25 * dpi;
				y += 1.75 * dpi;
			} else {
				x += 2.75 * dpi;
			}
		});

		if (numExcluded > 0) alert(`${numExcluded} items were excluded because one or more fields were empty in the item list!`);

        canvas.toBlob(blob => {
			imageUrl = URL.createObjectURL(blob);
            navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        });
	}

	function openAdvanced() {
		popupVisible = true;
	}

	function runAdvanced() {
		let currentName = "";
		let currentOwner = "";
		for (const line of advancedInput.split("\n")) {
			const stripped = line.trim();
			if (stripped.startsWith("N:")) {
				currentName = stripped.slice(2);
			} else if (stripped.startsWith("O:")) {
				currentOwner = stripped.slice(2);
			} else {
				const numericOnly = stripped.replace(/[^0-9]/g, '');
				if (numericOnly.length > 0 && !isNaN(numericOnly)) {
					items = [...items, {name: currentName, owner: currentOwner, barcode: numericOnly}];
				}
			}
		}
		saveItemList();
		popupVisible = false;
	}

	function closeAdvanced() {
		popupVisible = false;
	}
</script>

<svelte:head>
	<title>SMC Equipment Tags</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,100..700;1,100..700&display=swap" rel="stylesheet">
</svelte:head>

{#if popupVisible}
<div class="popup">
	<div class="popup-content">
		<div style="padding-bottom:1em;">
			<b>Enter advanced input here:</b>
			<br/>
			<!-- <a href="">Instructions</a> -->
		</div>
		<div style="flex-grow: 4;padding-bottom:0.5em;">
			<textarea style="width:30vw;height:20vh;" bind:value={advancedInput}></textarea>
		</div>
		<div style="display:flex;flex-direction:row;justify-content:flex-end;">
			<button on:click={runAdvanced}><Icon path={mdiPlus} size={1}></Icon> Add & Save</button>
			<button on:click={closeAdvanced}><Icon path={mdiClose} size={1}></Icon> Close</button>
		</div>
	</div>
</div>
{/if}

<main>
	<img src="assets/logo_white.png" style="filter:invert(1);width:20em;" alt="logo">
	<h3>Enter items below:</h3>
	<div>
		<button on:click={newItem}><Icon path={mdiPlus} size={1}></Icon> New Item</button>
		<button on:click={confirmClear}><Icon path={mdiEraser} size={1}></Icon> Clear Items</button>
		<button on:click={openAdvanced}><Icon path={mdiCodeTags} size={1}></Icon> Advanced</button>
	</div>
	<br/>
	<ul style="display: inline-block;">
		{#if items.length < 1}
		<i style="color: rgba(0,0,0,0.5);">No items</i>
		{/if}
		{#each items as item}
		<li class="item">
			<ListItem bind:name={item.name} bind:barcode={item.barcode} bind:owner={item.owner}/>
			<button on:click={cloneItem(item)}><Icon path={mdiContentCopy} size={1}></Icon></button>
			<button class="delete-button" on:click={removeItem(item)}><Icon path={mdiClose} size={1}></Icon></button>
		</li>
		{/each}
	</ul>
	<br/>
	<button on:click={generatePrint}><Icon path={mdiFileDocumentCheck} size={1}></Icon> Save & Generate Sheet</button>
	<br/>
	{#if imageUrl}
	<img src={imageUrl} style="width:100%;" alt="Printout">
	{/if}
</main>

<style>
	:global(body) {
		padding: 0;
		display: inline-block;
	}
    main {
        text-align: center;
        margin-top: 50px;
    }
    button {
        margin-left: 10px;
        padding: 10px;
        cursor: pointer;
    }
	.delete-button {
		font-weight: bold;
		color: red;
	}
	.item {
		display: flex;
		align-items: center;
		gap: 1rem; /* Adjust spacing between form and delete button */
		margin-bottom: 1rem;
	}
	.popup {
		display: block;
		position: fixed;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
	}
	.popup-content {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background-color: white;
		padding: 20px;
		border-radius: 5px;
		box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.5);
		display: flex;
		flex-direction: column;
	}
</style>