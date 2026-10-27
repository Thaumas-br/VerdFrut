
"use strict";

// ============================================
// 1. CONFIGURAÇÕES DA LOJA
// ============================================

// Chaves utilizadas para guardar informações no navegador.
const CHAVE_CARRINHO = "verdfrut_carrinho";
const CHAVE_CUPOM = "verdfrut_cupom";

// Valores demonstrativos da loja.
const VALOR_ENTREGA = 8.90;
const TAXA_CASHBACK = 0.03;

// ============================================
// 2. REFERÊNCIAS AOS ELEMENTOS DO HTML
// ============================================

const elementos = {
  carrinho: document.querySelector("#itens-carrinho"),
  subtotal: document.querySelector("#subtotal"),
  entrega: document.querySelector("#entrega"),
  total: document.querySelector("#total"),
  cashback: document.querySelector("#cashback"),
  formCupom: document.querySelector("#form-cupom"),
  campoCupom: document.querySelector("#cupom"),
  mensagemCupom: document.querySelector("#mensagem-cupom"),
  botaoFinalizar: document.querySelector("#finalizar-pedido")
};

// ============================================
// 3. FUNÇÕES AUXILIARES
// ============================================

// Formata valores numéricos como moeda brasileira.
function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

// Lê os dados salvos no navegador.
// Se não houver dados válidos, começa com um carrinho vazio.
function lerDados(chave, valorPadrao) {
  try {
    const dados = localStorage.getItem(chave);

    return dados === null
      ? valorPadrao
      : JSON.parse(dados);
  } catch (erro) {
    console.error(`Não foi possível ler ${chave}:`, erro);
    return valorPadrao;
  }
}

// ============================================
// 4. ESTADO DO CARRINHO
// ============================================

// Cada produto terá: id, nome, imagem, preço, unidade e quantidade.
let carrinho = lerDados(CHAVE_CARRINHO, []);
let cupomAplicado = lerDados(CHAVE_CUPOM, "");

// Valida os dados recuperados do armazenamento.
if (
  !Array.isArray(carrinho) ||
  !carrinho.every(item =>
    item &&
    typeof item.id === "string" &&
    typeof item.nome === "string" &&
    typeof item.imagem === "string" &&
    typeof item.unidade === "string" &&
    Number.isFinite(item.preco) &&
    item.preco >= 0 &&
    Number.isSafeInteger(item.quantidade) &&
    item.quantidade > 0
  )
) {
  carrinho = [];
}

if (typeof cupomAplicado !== "string") {
  cupomAplicado = "";
}

// Salva o estado atual no navegador.
function salvarCarrinho() {
  localStorage.setItem(
    CHAVE_CARRINHO,
    JSON.stringify(carrinho)
  );

  localStorage.setItem(
    CHAVE_CUPOM,
    JSON.stringify(cupomAplicado)
  );
}

// ============================================
// 5. IDENTIFICAÇÃO DOS PRODUTOS
// ============================================

// Lê as informações dos cartões de produtos do HTML.
// O preço é obtido do último parágrafo de cada cartão.
const produtos = Array.from(
  document.querySelectorAll("article.produto")
).map(artigo => {
  const titulo = artigo.querySelector("h3");
  const imagem = artigo.querySelector("img");
  const paragrafos = artigo.querySelectorAll("p");
  const botao = artigo.querySelector("button");

  if (!titulo || !imagem || paragrafos.length < 2 || !botao) {
    throw new Error("Um cartão de produto está incompleto.");
  }

  const textoPreco = paragrafos[paragrafos.length - 1]
    .textContent
    .trim();

  // Converte, por exemplo, "R$ 9,98" em 9.98.
  const preco = Number(
    textoPreco
      .replace("R$", "")
      .trim()
      .replace(/\./g, "")
      .replace(",", ".")
  );

  if (!Number.isFinite(preco) || preco < 0) {
    throw new Error(`Preço inválido para ${titulo.textContent}.`);
  }

  return {
    id: artigo.dataset.id,
    nome: titulo.textContent.trim(),
    imagem: imagem.getAttribute("src"),
    preco,
    unidade: paragrafos[0].textContent.trim()
  };
});

// ============================================
// 6. ADICIONAR PRODUTOS AO CARRINHO
// ============================================

function adicionarProduto(id) {
  const produto = produtos.find(item => item.id === id);

  if (!produto) {
    console.error("Produto não encontrado:", id);
    return;
  }

  // Verifica se o produto já está no carrinho.
  const itemExistente = carrinho.find(item => item.id === id);

  if (itemExistente) {
    itemExistente.quantidade++;
  } else {
    carrinho.push({
      ...produto,
      quantidade: 1
    });
  }

  salvarCarrinho();
  renderizarCarrinho();
}

// ============================================
// 7. ALTERAR QUANTIDADE E REMOVER PRODUTOS
// ============================================

function alterarQuantidade(id, variacao) {
  const item = carrinho.find(produto => produto.id === id);

  if (!item) return;

  item.quantidade += variacao;

  // Se a quantidade chegar a zero, remove o produto.
  if (item.quantidade <= 0) {
    carrinho = carrinho.filter(produto => produto.id !== id);
  }

  salvarCarrinho();
  renderizarCarrinho();
}

function removerProduto(id) {
  carrinho = carrinho.filter(item => item.id !== id);

  salvarCarrinho();
  renderizarCarrinho();
}

// ============================================
// 8. CALCULAR OS VALORES DA COMPRA
// ============================================

function calcularTotais() {
  const subtotal = carrinho.reduce(
    (soma, item) => soma + item.preco * item.quantidade,
    0
  );

  // O cupom promocional concede frete grátis.
  const freteGratis = cupomAplicado === "VERDEESTREIA";

  const entrega = carrinho.length === 0
    ? 0
    : freteGratis
      ? 0
      : VALOR_ENTREGA;

  const total = subtotal + entrega;

  // Cashback estimado sobre os produtos, sem incluir a entrega.
  const cashback = subtotal * TAXA_CASHBACK;

  return { subtotal, entrega, total, cashback };
}

// ============================================
// 9. DESENHAR O CARRINHO NA TELA
// ============================================

function renderizarCarrinho() {
  if (!elementos.carrinho) return;

  // Limpa os itens exibidos anteriormente.
  elementos.carrinho.replaceChildren();

  if (carrinho.length === 0) {
    const mensagem = document.createElement("p");
    mensagem.textContent = "Sacola vazia";
    elementos.carrinho.appendChild(mensagem);
  }

  // Cria um cartão para cada produto do carrinho.
  carrinho.forEach(item => {
    const linha = document.createElement("div");
    linha.className = "item-carrinho";

    const nome = document.createElement("p");
    nome.textContent = `${item.nome} — ${formatarMoeda(item.preco)}`;

    const quantidade = document.createElement("p");
    quantidade.textContent =
      `Quantidade: ${item.quantidade} ${item.unidade}`;

    const totalItem = document.createElement("p");
    totalItem.textContent =
      `Total: ${formatarMoeda(item.preco * item.quantidade)}`;

    const botaoDiminuir = document.createElement("button");
    botaoDiminuir.type = "button";
    botaoDiminuir.textContent = "−";
    botaoDiminuir.setAttribute(
      "aria-label",
      `Diminuir quantidade de ${item.nome}`
    );
    botaoDiminuir.addEventListener("click", () => {
      alterarQuantidade(item.id, -1);
    });

    const botaoAumentar = document.createElement("button");
    botaoAumentar.type = "button";
    botaoAumentar.textContent = "+";
    botaoAumentar.setAttribute(
      "aria-label",
      `Aumentar quantidade de ${item.nome}`
    );
    botaoAumentar.addEventListener("click", () => {
      alterarQuantidade(item.id, 1);
    });

    const botaoRemover = document.createElement("button");
    botaoRemover.type = "button";
    botaoRemover.textContent = "Remover";
    botaoRemover.addEventListener("click", () => {
      removerProduto(item.id);
    });

    linha.append(
      nome,
      quantidade,
      totalItem,
      botaoDiminuir,
      botaoAumentar,
      botaoRemover
    );

    elementos.carrinho.appendChild(linha);
  });

  // Atualiza os valores apresentados na página.
  const totais = calcularTotais();

  elementos.subtotal.textContent = formatarMoeda(totais.subtotal);
  elementos.entrega.textContent = formatarMoeda(totais.entrega);
  elementos.total.textContent = formatarMoeda(totais.total);
  elementos.cashback.textContent = formatarMoeda(totais.cashback);

  // Não permite finalizar uma compra vazia.
  if (elementos.botaoFinalizar) {
    elementos.botaoFinalizar.disabled = carrinho.length === 0;
  }

  // Atualiza também os botões da vitrine.
  document.querySelectorAll("article.produto").forEach(artigo => {
    const botao = artigo.querySelector("button");
    const id = artigo.dataset.id;

    if (!botao) return;

    botao.textContent = carrinho.some(item => item.id === id)
      ? "Adicionar mais"
      : "Adicionar";
  });
}

// ============================================
// 10. APLICAR O CUPOM
// ============================================

if (elementos.formCupom) {
  elementos.formCupom.addEventListener("submit", evento => {
    evento.preventDefault();

    const codigo = elementos.campoCupom.value
      .trim()
      .toUpperCase();

    if (codigo === "VERDEESTREIA") {
      cupomAplicado = codigo;

      elementos.mensagemCupom.textContent =
        "Cupom aplicado! Você ganhou frete grátis.";

      elementos.mensagemCupom.setAttribute("role", "status");
    } else {
      cupomAplicado = "";

      elementos.mensagemCupom.textContent = codigo
        ? "Cupom inválido."
        : "Digite um código de cupom.";

      elementos.mensagemCupom.setAttribute("role", "status");
    }

    salvarCarrinho();
    renderizarCarrinho();
  });
}

// ============================================
// 11. IR PARA O CHECKOUT
// ============================================

if (elementos.botaoFinalizar) {
  elementos.botaoFinalizar.addEventListener("click", () => {
    if (carrinho.length === 0) {
      alert("Adicione pelo menos um produto à sacola.");
      return;
    }

    // O checkout recuperará os dados salvos no navegador.
    window.location.href = "checkout.html";
  });
}

// ============================================
// 12. INICIALIZAÇÃO
// ============================================

// Liga os botões "Adicionar" aos produtos correspondentes.
document.querySelectorAll("article.produto").forEach(artigo => {
  const botao = artigo.querySelector("button");

  botao.addEventListener("click", () => {
    adicionarProduto(artigo.dataset.id);
  });
});

// Mostra o carrinho salvo assim que a página é aberta.
renderizarCarrinho();
