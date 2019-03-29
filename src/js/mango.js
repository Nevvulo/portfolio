document.addEventListener("DOMContentLoaded", async function (event) {
	const mainTitle = document.getElementsByClassName('main-title')[0];

	const greetingSplit = `Mango`.split(' ').reverse();
	const splitInnerHTML = mainTitle.innerHTML.split('')
	for (let word in greetingSplit) {
		splitInnerHTML.unshift(`<div class="word-main-title" style="visibility: collapse;">${greetingSplit[word]}</div>`)
		if (word) {
			splitInnerHTML.unshift(' ')
		}
	}

	const displayAbout = () => {
		const description = document.getElementsByClassName('description')[0];
		setTimeout(() => {
			description.style = '';
			description.classList.add('animated', 'animatedFadeInUp', 'fadeInUp');
		}, 200);
	}

	mainTitle.innerHTML = splitInnerHTML.join('');
	// Represents the times between the next animation (100ms, then wait xms until next)
	const timings = [ 100, 230, 140, 70, 150 ];

	let index = 0;
	const queue = [ ...mainTitle.children ];
	const callNextAnimation = () => {
		const elm = queue[index]
		if (!elm) {
			// We're done with the introduction now, display description
			displayAbout();
			return;
		}

		const timing = timings[index];
		setTimeout(() => {
			elm.style = '';
			elm.classList.add('animated', 'animatedFadeInUp', 'fadeInUp');
			callNextAnimation()
		}, timing || 100);
		index++;
	}
	callNextAnimation()
	// Finally, remove the style from main title
	mainTitle.style = '';
});
