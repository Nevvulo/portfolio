const portfolioCards = {
	"zBot": {
		description: "zBot was a multi-purpose Discord bot application that allowed users to use commands to make their experience on their Discord server more enjoyable and interactive. It provided moderation commands to punish people for breaking rules, general purpose commands for advanced and detailed server management, as well as other fun commands to play around with.",
		github: "zBlakee/zBot",
		website: "https://zbot.me",
		avatar: "https://cdn.discordapp.com/avatars/345766303052857344/b65473af3e075ba54d400e276e55dd0b.png?size=2048"
	},
	"Remindo": {
		description: "Remindo is a desktop application made in Electron with the goal of being a viable replacement for Google Keep by providing advanced reminder options such as timers, comments and markdown whilst maintaining a sleek and simplistic design.",
		github: "zBlakee/remindo"
	}
}

const addPortfolioCard = (title, info) => {
	let html = "";
	html += `
	<div class="col s12 m6">
		<div class="card blue-grey darken-1 z-depth-1">
			<div class="card-content white-text">
				<span class="card-title">${info.avatar ? `<img class="avatar-small" src="${info.avatar}">` : ""} <b>${title}</b></span>
				<p>${info.description}</p>
			</div>

			<div class="card-action">
				<a href="#" class="btn red lighten-1">More Information</a>
				${info.github ? `<a href="https://github.com/${info.github}" style="background-color: #333" class="btn">GitHub</a>` : ""}
				${info.website ? `<a href="${info.website}" class="btn light-green darken-1">Website</a>` : ""}
			</div>
		</div>
	</div>
	`
	return html;
}

document.addEventListener("DOMContentLoaded", function(event) {
    for (const [key, value] of Object.entries(portfolioCards)) {
		console.log($(".cards"))
		console.log(addPortfolioCard(key, value))
		$(".cards").append(addPortfolioCard(key, value));
	}

	const greetings = ["G'day", "Hello", "Hi there", "Hey", "Hey there"];
	$(".main-title")
	.prepend(Math.floor(Math.random()*10)%2==0 ? ", " : "! ")
	.prepend(greetings[Math.floor(Math.random()*greetings.length)])
});
