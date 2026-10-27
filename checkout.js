
"use strict";

// ============================================
// 1. RECUPERAR OS DADOS DA COMPRA
// ============================================

const CHAVE_CARRINHO = "verdfrut_carrinho";
const CHAVE_CUPOM = "verdfrut_cupom";

const mensagem = document.querySelector("#mensagem-checkout");
const listaProdutos = document.querySelector("#resumo-produtos");
const formulario = document.querySelector("#form-checkout");

const VALOR_ENTREGA = 8.90;
const TAXA_CASHBACK = 0.03;

function lerDados(chave, valorPadrao) {
  try {
    const dados = localStorage.getItem(chave);

    return dados === null
      ? valorPadrao
      : JSON.parse(dados);
  } catch (erro) {
    console.error("Erro ao ler os dados da compra:", erro);
    return valorPadrao;
  }
}

const carrinho = lerDados(CHAVE_CARRINHO, []);
const cupom = lerDados(CHAVE_CUPOM, "");

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

// Verifica se os dados do carrinho têm o formato esperado.
const carrinhoValido =
  Array.isArray(carrinho) &&
  carrinho.every(item =>
    item &&
    typeof item.id === "string" &&
    typeof item.nome === "string" &&
    Number.isFinite(item.preco) &&
    item.preco >= 0 &&
    Number.isSafeInteger(item.quantidade) &&
    item.quantidade > 0
  );

// Impede o checkout de uma sacola vazia ou inválida.
if (!carrinhoValido || carrinho.length === 0) {
  formulario.hidden = true;

  mensagem.textContent =
    "Sua sacola está vazia ou contém dados inválidos. Volte à loja para adicionar produtos.";

  const link = document.createElement("a");
  link.href = "index.html";
  link.textContent = "Voltar à loja";

  mensagem.appendChild(document.createElement("br"));
  mensagem.appendChild(link);
} else {
  // ==========================================
  // 2. CALCULAR OS VALORES DO PEDIDO
  // ==========================================

  const subtotal = carrinho.reduce(
    (soma, item) => soma + item.preco * item.quantidade,
    0
  );

  const freteGratis = cupom === "VERDEESTREIA";

  const entrega = freteGratis ? 0 : VALOR_ENTREGA;
  const total = subtotal + entrega;
  const cashback = subtotal * TAXA_CASHBACK;

  document.querySelector("#checkout-subtotal").textContent =
    formatarMoeda(subtotal);

  document.querySelector("#checkout-entrega").textContent =
    formatarMoeda(entrega);

  document.querySelector("#checkout-total").textContent =
    formatarMoeda(total);

  document.querySelector("#checkout-cashback").textContent =
    formatarMoeda(cashback);

  // ==========================================
  // 3. MOSTRAR OS PRODUTOS DO PEDIDO
  // ==========================================

  carrinho.forEach(item => {
    const linha = document.createElement("div");
    linha.className = "resumo-item";

    const nome = document.createElement("p");
    nome.textContent = item.nome;

    const quantidade = document.createElement("p");
    quantidade.textContent =
      `Quantidade: ${item.quantidade}`;

    const valor = document.createElement("p");
    valor.textContent =
      `Valor: ${formatarMoeda(item.preco * item.quantidade)}`;

    linha.append(nome, quantidade, valor);
    listaProdutos.appendChild(linha);
  });

  // ==========================================
  // 4. CONFIRMAR O PEDIDO DEMONSTRATIVO
  // ==========================================

  formulario.addEventListener("submit", evento => {
    evento.preventDefault();

    // O navegador verifica required, email e minlength
    // antes de disparar este evento.

    const dados = new FormData(formulario);

    const nome = dados.get("nome").trim();
    const pagamento = dados.get("pagamento");

    if (!nome || !pagamento) {
      mensagem.textContent =
        "Preencha todos os campos obrigatórios.";
      return;
    }

    // IMPORTANTE:
    // Esta confirmação existe apenas no navegador.
    // Não envia o pedido a uma loja nem realiza pagamento.

    mensagem.replaceChildren();

    const titulo = document.createElement("h3");
    titulo.textContent = "Pedido demonstrativo confirmado!";

    const saudacao = document.createElement("p");
    saudacao.textContent =
      `Obrigado pela compra, ${nome}!`;

    const valorFinal = document.createElement("p");
    valorFinal.textContent =
      `Valor do pedido: ${formatarMoeda(total)}`;

    const aviso = document.createElement("p");
    aviso.textContent =
      "Esta é uma simulação acadêmica. Nenhum pagamento foi realizado e nenhum pedido foi enviado ao servidor.";

    mensagem.append(titulo, saudacao, valorFinal, aviso);

    // Desativa o formulário para evitar confirmação duplicada.
    formulario.querySelectorAll("input, select, button")
      .forEach(campo => {
        campo.disabled = true;
      });

    // Limpa o carrinho local após a simulação.
    localStorage.removeItem(CHAVE_CARRINHO);
    localStorage.removeItem(CHAVE_CUPOM);
  });
}
