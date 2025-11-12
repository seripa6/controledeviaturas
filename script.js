document.addEventListener("DOMContentLoaded", () => {

    const scriptURL = 'https://script.google.com/macros/library/d/1527FNtR6esUMs8B5pk1k0rHYeaA6Vq4YaZkhc71EnPRaU0pzjEZujT5c/1';
    const form = document.getElementById('formViatura');
    const msg = document.getElementById('mensagem');
    let enviando = false;

    const selectViatura = document.getElementById("viatura"); // Saída
    const selectChegada = document.getElementById("viaturaChegada"); // Chegada
    const kmSaidaDiv = document.getElementById("buscarKmSaida"); // Saída
    const kmSaidaChegadaDiv = document.getElementById("kmSaidaChegada"); // Chegada
    const kmSaidaInput = document.getElementById("kmSaidaInput"); // input hidden para Saída

    const tipoRegistro = document.title.includes('Saída') ? 'saida' : document.title.includes('Chegada') ? 'chegada' : '';

    const viaturas = [
        { nome: "L200", status: "disponibilidadeL200", infoClass: "infoL200", motoristaId: "motoristaL200", missaoId: "missaoL200", celulas: ["Q2", "Q3", "Q4", "Q5"] },
        { nome: "Frontier", status: "disponibilidadeFrontier", infoClass: "infoFrontier", motoristaId: "motoristaFrontier", missaoId: "missaoFrontier", celulas: ["R2", "R3", "R4", "R5"] },
        { nome: "Ranger", status: "disponibilidadeRanger", infoClass: "infoRanger", motoristaId: "motoristaRanger", missaoId: "missaoRanger", celulas: ["S2", "S3", "S4", "S5"] },
        { nome: "Doblo", status: "disponibilidadeDoblo", infoClass: "infoDoblo", motoristaId: "motoristaDoblo", missaoId: "missaoDoblo", celulas: ["T2", "T3", "T4", "T5"] }
    ];

    const sheetId = "1yQTzn5uz3F3EWNLraWoZw3aznu1mcoYA_YgQK5KlRCg";
    const aba = "informações";

    // ===================== ENVIO DO FORMULÁRIO =====================
    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            if (enviando) return;
            enviando = true;

            const botao = form.querySelector('button[type="submit"]');
            if (botao) botao.disabled = true;

            const dados = new FormData(form);
            dados.append('tipo', tipoRegistro);

            fetch(scriptURL, { method: 'POST', body: dados })
                .then(res => res.json())
                .then(data => window.location.href = "registrado.html")
                .catch(err => window.location.href = "registrado.html");
        });
    }

    // ===================== BUSCAR CÉLULAS =====================
    function buscarCelula(celula, callback) {
        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${aba}&range=${celula}`;
        fetch(url)
            .then(res => res.text())
            .then(text => {
                const json = JSON.parse(text.substr(47).slice(0, -2));
                const valor = json.table.rows[0]?.c[0]?.v || "—";
                callback(valor);
            })
            .catch(() => callback("—"));
    }

    // ===================== ATUALIZAR STATUS =====================
    function atualizarDisponibilidade() {
        viaturas.forEach(v => {
            const statusElem = document.getElementById(v.status);
            if (!statusElem) return;

            let status = statusElem.textContent.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            // Select Saída
            if (selectViatura) {
                const option = selectViatura.querySelector(`option[value="${v.nome}"]`);
                if (option) {
                    option.disabled = status !== "disponivel";
                    option.hidden = status !== "disponivel";
                }
            }

            // Select Chegada
            if (selectChegada) {
                const option = selectChegada.querySelector(`option[value="${v.nome}"]`);
                if (option) {
                    option.disabled = status === "disponivel";
                    option.hidden = status === "disponivel";
                }
            }

            // Cards
            document.querySelectorAll(`.${v.infoClass}`).forEach(el => {
                if (status === "disponivel") el.classList.add("esconder");
                else el.classList.remove("esconder");
            });
        });
    }

    // ===================== ATUALIZA TODAS AS CÉLULAS =====================
    function atualizarTodos() {
        viaturas.forEach(v => {
            buscarCelula(v.celulas[0], valor => {
                const elem = document.getElementById(v.status);
                if (elem) elem.textContent = valor;
                atualizarDisponibilidade();
            });
            buscarCelula(v.celulas[1], valor => {
                const elem = document.getElementById(v.motoristaId);
                if (elem) elem.textContent = valor;
            });
            buscarCelula(v.celulas[2], valor => {
                const elem = document.getElementById(v.missaoId);
                if (elem) elem.textContent = valor;
            });
            buscarCelula(v.celulas[3], valor => {
                const elem = document.getElementById(v.nome + "KmSaida");
                if (elem) elem.textContent = valor;
            });
        });
    }

    // ===================== SAÍDA =====================
    if (selectViatura) {
        selectViatura.addEventListener("change", () => {
            const viaturaSelecionada = selectViatura.value;
            const v = viaturas.find(x => x.nome === viaturaSelecionada);
            if (!v) {
                if (kmSaidaDiv) kmSaidaDiv.textContent = "—";
                if (kmSaidaInput) kmSaidaInput.value = "";
                return;
            }
            buscarCelula(v.celulas[3], valor => {
                if (kmSaidaDiv) kmSaidaDiv.textContent = valor;
                if (kmSaidaInput) kmSaidaInput.value = valor;
            });
        });
    }

    // ===================== CHEGADA =====================
    if (selectChegada) {
        selectChegada.addEventListener("change", () => {
            const viaturaSelecionada = selectChegada.value;
            const v = viaturas.find(x => x.nome === viaturaSelecionada);
            if (!v) {
                if (kmSaidaChegadaDiv) kmSaidaChegadaDiv.textContent = "—";
                return;
            }
            buscarCelula(v.celulas[3], valor => {
                if (kmSaidaChegadaDiv) kmSaidaChegadaDiv.textContent = valor;
            });
        });
    }
    // ===================== VALIDAÇÃO KM CHEGADA =====================
    const kmChegadaInput = document.getElementById("kmChegada");

    if (kmChegadaInput && kmSaidaChegadaDiv) {
        const msgErro = document.createElement("p");
        msgErro.style.color = "red";
        msgErro.style.display = "none";
        msgErro.style.textAlign = "center";
        msgErro.textContent = "O KM de chegada não pode ser menor que o KM de saída.";
        kmChegadaInput.insertAdjacentElement("afterend", msgErro);

        kmChegadaInput.addEventListener("blur", () => {
            const kmSaida = parseFloat(kmSaidaChegadaDiv.textContent) || 0;
            const kmChegada = parseFloat(kmChegadaInput.value) || 0;

            if (kmChegada < kmSaida) {
                msgErro.style.display = "block";
                kmChegadaInput.value = "";
                kmChegadaInput.focus();
            } else {
                msgErro.style.display = "none";
            }
        });
    }

    // ===================== ATUALIZA AUTOMATICAMENTE =====================
    atualizarTodos();
    setInterval(atualizarTodos, 5000);

});

