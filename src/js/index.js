// Thanks to https://github.com/jonathantneal/array-flat-polyfill/blob/master/src/index.js!
const _flatPolyfill = (arr, argument) => {
  let depth = isNaN(argument) ? 1 : Number(argument);
  const stack = Array.prototype.slice.call(arr);
  const result = [];

  while (depth && stack.length) {
    const next = stack.pop();
    if (Object(next) instanceof Array) {
      --depth;
      Array.prototype.push.apply(stack, next);
    } else {
      result.unshift(next);
    }
  }

  return result.concat(stack);
};

const portfolioCards = {
  'Dank Memer': {
    description: 'A Discord bot serving over 50 thousand users daily (25+ million total) in over 1 million servers. Provides users with funny memes and joke/entertainment commands to play around with, as well as an interactive and detailed currency system which is my main area of work.',
    github: 'Dank-Memer',
    website: 'http://dankmemer.lol',
    avatar: './assets/img/dank-memer.png',
    role: 'Developer',
    languages: [ 'JavaScript', 'Node.js', 'Python' ]
  },
  'Poplet': {
    description: 'Poplet is a note-taking web application that aims to combine the functionality of multiple services to form an all-in-one useful way to share ideas and collaborate with people easily.',
    github: 'popletapp',
    avatar: './assets/svg/poplet.svg',
    website: 'https://popletapp.com',
    role: 'Lead Developer',
    languages: [ 'React', 'JavaScript', 'Node.js', 'HTML', 'CSS' ]
  },
  'zBot': {
    description: 'zBot was a multi-purpose Discord bot application that allowed users to use commands to make their experience on their Discord server more enjoyable and interactive. It provided moderation commands to punish people for breaking rules, general purpose commands for advanced and detailed server management, as well as other fun commands to play around with. It has since been discontinued.',
    github: 'zBlakee/zBot',
    avatar: './assets/img/zbot.png',
    role: 'Lead Developer',
    languages: [ 'JavaScript', 'Node.js', 'HTML', 'CSS' ]
  },
  'Powercord': {
    description: 'A client modification made for Discord. I have helped write code for the client injector, as well as multiple plugins that range extensively in skill sets, such as audio visualizers with Electron API\'s, use of React components, and other plugins as well.',
    github: 'powercord-org/powercord',
    avatar: 'https://powercord.dev/assets/logo.svg',
    website: 'https://powercord.dev/',
    role: [ 'Contributor', 'Plugin Developer' ],
    languages: [ 'React', 'JavaScript', 'Node.js', 'CSS' ]
  },
  'theShell': {
    description: 'theShell is an open-source desktop environment developed using [Qt](https://www.qt.io/). The main goal is to be an "all-in-one" package for those who want the simplicity and functionality of a normal desktop environment, whilst also having the advanced features for developers.',
    github: 'vicr123/theShell',
    website: 'https://vicr123.com',
    avatar: 'https://vicr123.com/images/theshell.png',
    role: 'Contributor',
    languages: [ 'C++' ]
  },
  'Remindo': {
    description: 'Remindo is a desktop application made in Electron with the goal of being a viable replacement for Google Keep by providing advanced reminder options such as timers, comments and markdown whilst maintaining a sleek and simplistic design.',
    github: 'zBlakee/remindo',
    role: 'Lead Developer',
    languages: [ 'JavaScript', 'HTML', 'CSS' ]
  },
  'Securebot': {
    description: 'A simple program that had multiple tools that allowed you to generate a password, check your password strength, check how secure your computer was, as well as giving you advice for how to combat viruses and general computer issues. Securebot also featured a password manager that had a master password lock.',
    github: 'zBlakee/Securebot',
    role: 'Lead Developer',
    languages: [ 'Visual Basic' ]
  }
};

const languageColors = {
  'JavaScript': '#ff9800',
  'React': '#26a69a',
  'Node.js': '#66bb6a',
  'C++': '#ec407a',
  'HTML': '#ef5350',
  'CSS': '#673ab7',
  'Visual Basic': '#ba68c8',
  'Python': '#1976d2'
};

const roleColors = {
  'Lead Developer': '#2e7d32',
  'Developer': '#558b2f',
  'Contributor': '#00838f'
};

const addPortfolioCard = (title, info) => {
  let html = '';
  html += `
		<div class="card z-depth-1 z-depth-1" style="visibility: collapse;">
			<div class="card-content white-text">
				<span class="card-title">
				${info.avatar ? `<img class="avatar-small" src="${info.avatar}">` : ''} 
				<b>${title} ${(Array.isArray(info.role) ? info.role : [ info.role ]).map(role => `<div class="badge" style="background-color: ${roleColors[role] || '#424242'}">${role}</div>`).join('')}</b>
				</span>
				<p>${marked(info.description)}</p>
				<br>
				${info.languages.map(language => `<div class="badge" style="background-color: ${languageColors[language] || 'grey'}">${language}</div>`).join('')}
			</div>

			<div class="card-action">
				${info.moreinfo ? '<a class="btn action-button" href="#"><img src="assets/svg/information.svg" height=32 width=32>More Information</a>' : ''}
				${info.github ? `<a class="btn action-button" href="https://github.com/${info.github}"><img src="assets/svg/github.svg" height=32 width=32>GitHub</a>` : ''}
				${info.website ? `<a class="btn action-button" href="${info.website}"><img src="assets/svg/network.svg" height=32 width=32>Website</a>` : ''}
			</div>
		</div>
	`;
  return html;
};

document.addEventListener('DOMContentLoaded', async (event) => {
  const mainTitle = document.getElementsByClassName('main-title')[0];
  let column = 1;
  for (const [ key, value ] of Object.entries(portfolioCards)) {
    document.querySelector(`.cards-column-${column}`).innerHTML += addPortfolioCard(key, value);
    column++;
    if (column > 2) {
      column = 1;
    }
  }

  let greetings = [ "G'day", 'Hello', 'Hi there', 'Hey', 'Hey there' ];
  greetings = greetings.map(e => `${e}${Math.floor(Math.random() * 10) % 2 === 0 ? ', ' : '! '}`);
  const chosen = greetings[Math.floor(Math.random() * greetings.length)];
  const splitInnerHTML = mainTitle.innerHTML.split('');

  const greetingSplit = [ ..._flatPolyfill(chosen.trim().split(' ')), 'I\'m', 'Blake.' ].reverse();
  for (const word in greetingSplit) {
    splitInnerHTML.unshift(`<div class="word-main-title" style="visibility: collapse;">${greetingSplit[word]}</div>`);
    if (word) {
      splitInnerHTML.unshift(' ');
    }
  }

  const displayCards = () => {
    const cards = document.querySelectorAll('.card');
    let timing = 100;
    for (const card of cards) {
      setTimeout(() => {
        card.style = '';
        card.classList.add('animated', 'animatedFadeInUp', 'fadeInUp');
      }, timing);
      timing += 100;
    }
  };

  const displayRest = () => {
    const bio = document.querySelector('.lower-half');
    setTimeout(() => {
      bio.style = '';
      bio.classList.add('animated', 'animatedFadeInUp', 'fadeInUp');
    }, 200);
    displayCards();
  };

  mainTitle.innerHTML = splitInnerHTML.join('');
  // Represents the times between the next animation (100ms, then wait xms until next)
  const timings = [ 230, 100 ];

  let index = 0;
  let elementIndex = 0;
  const queue = [ ...mainTitle.children ];
  const callNextAnimation = () => {
    const elm = queue[elementIndex];
    if (!elm) {
      // We're done with the introduction now, display description
      return displayRest();
    }
    const wordIsPartOfGreeting = chosen.includes(elm.innerHTML);
    const timing = timings[index];
    setTimeout(() => {
      elm.style = '';
      if (!wordIsPartOfGreeting) {
        index++;
      }
      if (elm.innerHTML.includes('Blake')) {
        const avatar = document.getElementsByClassName('avatar')[0];
        avatar.style = '';
        avatar.classList.add('animated', 'animatedFadeInUp', 'fadeInUp');
      }
      elm.classList.add('animated', 'animatedFadeInUp', 'fadeInUp');
      elementIndex++;
      callNextAnimation();
    }, wordIsPartOfGreeting ? 100 : timing);
  };
  callNextAnimation();
  // Finally, remove the style from main title
  mainTitle.style = '';
});
