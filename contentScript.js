"use strict";

// Command+enter
$(document).on("keydown",function(e) {
	if((event.ctrlKey || event.metaKey) && event.which == 13) {
		event.preventDefault();
		$("button[data-test-id=exercise-check-answer]").click();
		if ($("button[data-test-id=exercise-next-question]").length) {
			// Answer was right
			// $("button[data-test-id=exercise-next-question]").focus(); // Alternative shortcut
			$("button[data-test-id=exercise-next-question]").click();
		}
		return false;
	};
});

// Mathjs Settings
const MAX_STR_LENGTH = 7;
math.config({
	number: "Fraction"
});

// Mathjs Preview
function injectMathJS () {
	// Setup
	let evalAnswerStoredArray = [];

	// Find each MathML element
	$(".katex").each((i, el) => {
		if (
				$(el).css("visibility") !== "hidden" && // Confirm this is a valid KaTeX not an off-screen one
				$(el).parents(".tooltipContainer").length < 1 && // + not a tooltip
				$(el).find(".INJECTED-MATHJS").length < 1 // + not already injected
			) {

			// Tidy up evaluation string
			let evalString = $(el).children().find("annotation").html() || "?",
				evalAnswer = "";
			evalString = evalString
				.trim()
				.replace(/\\large{([^}]+)}/gi, "$1") // capture text in large format
				.replace(/\\small{([^}]+)}/gi, "$1") // capture text in small format
				.replace(/\\(?:red|orange|yellow|green|blue|purple|maroon)\w{([^}]+)}/gi, "$1") // capture text in colored block
				.replace(/\\(?:red|orange|yellow|green|blue|purple|maroon)\w(\d)/gi, "$1") // capture number in colored block without {}
				.replace(/[=~?]/g, "") // remove = or ~ or ?
				.replace(/\\approx/gi, "") // remove approx =
				.replace(/\\,/g, "").replace(/{,}/g, "") // remove \, and {,}
				.replace(/{}/g, "") // remove {} (placeholder for answer box)
				.replace(/\\text{\s?(?:m|cm)}/gi, "") // remove words m, cm
				.replace(/(\d?)\\d?frac{?(\d+)}?{(\d+)}/g, "($1*$3+$2)/$3") // capture mixed numbers
				.replace(/(\d?)\\d?frac(\d)(\d)/g, "($1*$3+$2)/$3") // capture mixed numbers without {} in mathML
				.replace(/\(\*\d+\+/g, "(") // then re-format fraction if it's not a mixed number aka (*5+6)/7 --> 6/7
				.replace(/\\times/gi, "*") // replace \times with *
				.replace(/\\div/gi, "/") // replace \div with /
				.replace(/^[-+*/]/, "") // remove ±*/ at start of string, https://stackoverflow.com/questions/42228962/regex-match-specific-symbol
				.replace(/[-+*/]$/, ""); // remove ±*/ at end of string


			// Is the evaluation string something math-related and worth calculating?
			if (/\d+/.test(evalString)) {
				// Attempt to evaluate
				try {
					evalAnswer = math.evaluate(evalString); // trim the string (i.e. for fractions)
					evalAnswerStoredArray.push(evalAnswer); // Add to array if evaluation successful
				} catch (err) {
					console.log(evalString, $(el), err);
					evalAnswer = "?";
				} finally {
					// Append answer if worth showing
					if (evalString.length > 2 && evalAnswer !== "?") {
						$(el).append(`<span class="INJECTED-MATHJS">&nbsp; { ` + evalAnswer.toString().substring(0, MAX_STR_LENGTH) + ` }</span>`);
					}
				}
			}
		}
	});

	// Add analysis -- Run Once
	if ($("form[name='answerform']").find(".INJECTED-ANALYSIS").length < 1 && evalAnswerStoredArray.length) {
		let calculatedSum = evalAnswerStoredArray.reduce((curSum, curNum) => curSum + (isNaN(curNum) ? 0 : curNum), 0);
		let calculatedDiff = Math.abs(2*evalAnswerStoredArray[0] - calculatedSum) || "";
		let calculatedMult = evalAnswerStoredArray.reduce((curMult, curNum) => curMult * (isNaN(curNum) ? 1 : curNum), 1);
		let calculatedDiv = (Math.max.apply(Math, evalAnswerStoredArray) / Math.min.apply(Math, evalAnswerStoredArray)) || "";

		$(".perseus-renderer").eq(0).append(
			`<div class="paragraph INJECTED-ANALYSIS">[` + evalAnswerStoredArray.toString() + `]<br>` +
			`Sum: ` + calculatedSum.toString().substring(0, MAX_STR_LENGTH) + `<br>` +
			`Diff: ` + calculatedDiff.toString().substring(0, MAX_STR_LENGTH) + `<br>` +
			`Mult: ` + calculatedMult.toString().substring(0, MAX_STR_LENGTH) + `<br>` +
			`Div: ` + calculatedDiv.toString().substring(0, MAX_STR_LENGTH) + `<br>` +
			`</div>`
		)
	}

	// Extra: Disable Focus on X Button
	$("button[data-test-id=close-modal-btn]").prop("tabIndex", "-1");
}

const injectMathJSInterval = setInterval(injectMathJS, 200);
// Or https://gist.github.com/chrisjhoughton/7890303
