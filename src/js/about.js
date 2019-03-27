document.addEventListener("DOMContentLoaded", async function (event) {
	const mainTitle = document.getElementsByClassName('main-title')[0];

	const greetingSplit = [ 'But,', 'who', 'am', 'I', 'really?' ].reverse();
	const splitInnerHTML = mainTitle.innerHTML.split('')
	for (let word in greetingSplit) {
		splitInnerHTML.unshift(`<div class="word-main-title" style="visibility: collapse;">${greetingSplit[word]}</div>`)
		if (word) {
			splitInnerHTML.unshift(' ')
		}
	}

	const displayAbout = () => {
		const back = document.getElementsByClassName('lower-half')[0];
		const about = document.getElementsByClassName('about')[0];
		setTimeout(() => {
			about.style = back.style = '';
			about.classList.add('animated', 'animatedFadeInUp', 'fadeInUp');
			back.classList = about.classList;
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
