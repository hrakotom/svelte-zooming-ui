// Coffee flavour wheel — same subject as the amCharts demo, for comparison.
export const coffee = {
		name: 'coffee',
		children: [
			{ name: 'Flora', children: [
				{ name: 'Black Tea', value: 1 },
				{ name: 'Floral', children: [
					{ name: 'Chamomile', value: 1 }, { name: 'Rose', value: 1 }, { name: 'Jasmine', value: 1 }
				]}
			]},
			{ name: 'Fruity', children: [
				{ name: 'Berry', children: [
					{ name: 'Blackberry', value: 1 }, { name: 'Raspberry', value: 1 },
					{ name: 'Blueberry', value: 1 }, { name: 'Strawberry', value: 1 }
				]},
				{ name: 'Citrus', children: [
					{ name: 'Lemon', value: 1 }, { name: 'Lime', value: 1 }, { name: 'Grapefruit', value: 1 }
				]}
			]},
			{ name: 'Sour', children: [
				{ name: 'Sour Aromatics', value: 1 },
				{ name: 'Alcohol', children: [{ name: 'Winey', value: 1 }, { name: 'Whiskey', value: 1 }]}
			]},
			{ name: 'Roasted', children: [
				{ name: 'Cereal', children: [{ name: 'Grain', value: 1 }, { name: 'Malt', value: 1 }]},
				{ name: 'Burnt', children: [{ name: 'Smoky', value: 1 }, { name: 'Ashy', value: 1 }]}
			]},
			{ name: 'Nutty', children: [
				{ name: 'Nutty', children: [{ name: 'Almond', value: 1 }, { name: 'Hazelnut', value: 1 }]},
				{ name: 'Cocoa', children: [{ name: 'Chocolate', value: 1 }, { name: 'Dark Chocolate', value: 1 }]}
			]},
			{ name: 'Sweet', children: [
				{ name: 'Vanilla', value: 1 }, { name: 'Honey', value: 1 },
				{ name: 'Caramelized', children: [{ name: 'Maple Syrup', value: 1 }, { name: 'Molasses', value: 1 }]}
			]},
			{ name: 'Spices', children: [
				{ name: 'Pungent', value: 1 },
				{ name: 'Brown Spice', children: [{ name: 'Cinnamon', value: 1 }, { name: 'Nutmeg', value: 1 }]}
			]}
		]
	};
