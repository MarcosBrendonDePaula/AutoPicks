// ==UserScript==
// @name         AutoPick
// @namespace    http://tampermonkey.net/
// @version      2024-06-02
// @description  Faz o auto pick no blockpicks!
// @author       You
// @match        https://www.blockpicks.gg/prediction*
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    async function awaitPicksSelection() {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Aguarda 10 segundos

        console.log('Iniciando seleção de picks...');
        try {
            const response = await $.ajax({
                url: 'http://localhost:9512/picks',
                type: 'GET',
                dataType: 'json'
            });

            if (response && Array.isArray(response.picks) && response.picks.length > 0) {
                console.log('Picks encontrados:', response.picks.length);

                for (let i = 0; i < response.picks.length; i++) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    const pick = response.picks[i];
                    console.log('Selecionando pessoa:', pick.people);
                    $(".slick-current button").eq(pick.people).click();

                    await new Promise(resolve => setTimeout(resolve, 1000)); // Aguarda 1 segundo

                    console.log('Selecionando opção:', pick.option);
                    $(".slick-current button").eq(pick.option + 2).click();

                    await new Promise(resolve => setTimeout(resolve, 1000)); // Aguarda 1 segundo

                    if (i === response.picks.length - 1) {
                        console.log('Todos os picks foram concluídos.');
                        findButtonByTextInSpan("Submit my picks").click();
                    } else {
                        console.log('Próximo pick.');
                        findButtonByTextInSpan("Next").click();
                    }
                }
            } else {
                console.log('No picks available');
            }
        } catch (error) {
            console.error(error);
        }
    }

    function findButtonByTextInSpan(text) {
        const buttons = $('span.MuiTypography-button').closest('button');
        for (let i = 0; i < buttons.length; i++) {
            if ($(buttons[i]).text().trim() === text.trim()) {
                return buttons[i];
            }
        }
        return null;
    }

    if (window.location.href.startsWith("https://www.blockpicks.gg/prediction")) {
        awaitPicksSelection();
    }
})();
