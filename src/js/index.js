const portfolioCards = {
	"zBot": "zBot was a multi-purpose Discord bot application that allowed users to use commands to make their experience on their Discord server more enjoyable and interactive. It provided moderation commands to punish people for breaking rules, general purpose commands for advanced and detailed server management, as well as other fun commands to play around with.",
	"Remindo": "Remindo is a desktop application made in Electron with the goal of being a viable replacement for Google Keep by providing advanced reminder options such as timers, comments and markdown whilst maintaining a sleek and simplistic design."
}

const addPortfolioCard = (title, description) => {
	let html = "";
	html += `
	<div class="col s12 m6">
		<div class="card blue-grey darken-1">
			<div class="card-content white-text">
				<span class="card-title"><b>${title}</b></span>
				<p>${description}</p>
			</div>

			<div class="card-action">
				<a href="#" class="btn cyan darken-3">More Information</a>
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
});
