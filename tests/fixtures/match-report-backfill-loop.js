    async function runBackfill() {
        var seenPages = new Set();
        while (true) {
            if (STATE.stopped) throw new Error("Importazione interrotta");
            try {
                var page = await waitResultsReady(null, 18000);
                if (!page) throw new Error("Pagina Results non disponibile");
                if (seenPages.has(page)) throw new Error("Pagina Results già percorsa: interrompo questo storico");
                seenPages.add(page);
                await processCurrentResultsPage();
                setPhase("PRECEDENTI");
                if (!await goPrevious()) return;
            } catch (error) {
                if (STATE.stopped) throw error;
                STATE.errors++;
                log(clean(error.message) + " · SKIP contesto · proseguo con divisione/nazione successiva", "warn");
                updateUI();
                return;
            }
        }
    }

