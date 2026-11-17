    function previousDisabled() {
        var clickable = q("#ResultsprevWeek_click");
        var blocked = q("#ResultsprevWeek_noclick");
        return !(clickable && visible(clickable)) && !!(blocked && visible(blocked) && blocked.classList.contains("disabled"));
    }

    function previousControl() {
        return qa("a,button").find(function (element) {
            var li = element.closest ? element.closest("li") : null;
            var idText = clean((element.id || "") + " " + (li && li.id || "")).toLowerCase();
            return visible(element) && norm(element.textContent) === "precedenti" && !/noclick|disabled/.test(idText);
        }) || null;
    }

    async function goPrevious() {
        if (previousDisabled()) return false;
        var control = previousControl();
        if (!control) throw new Error("Controllo PRECEDENTI assente senza fine storico confermata");
        var before = resultsPageState();
        var request = control.cloneNode(true);
        // Repeat the SAME target page, even when an error replaces the Results DOM.
        for (var attempt = 1; attempt <= 3; attempt++) {
            if (STATE.stopped) throw new Error("Importazione interrotta");
            if (attempt > 1 && await waitResultsReady(function (state) { return state !== before; }, 1200)) return true;
            var retry = request.cloneNode(true);
            retry.style.display = "none";
            document.body.appendChild(retry);
            try { await realClick(retry); } finally { retry.remove(); }
            if (await waitResultsReady(function (state) { return state !== before; }, 22000)) return true;
            log("PRECEDENTI · caricamento fallito " + attempt + "/3", "warn");
        }
        throw new Error("PRECEDENTI: tre caricamenti falliti · salto divisione/nazione");
    }

