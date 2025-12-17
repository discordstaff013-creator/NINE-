import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";
import config from "../../config.json" assert { type: "json" };

export class ActionSystem {
  constructor(client) {
    this.client = client;
    this.acaoAtual = null;

    this.ranking = {
      total: 0,
      vitorias: 0,
      derrotas: 0
    };
  }

  async criar(interaction, dados) {
    if (this.acaoAtual) {
      return interaction.reply({
        content: "❌ Já existe uma ação em andamento.",
        ephemeral: true
      });
    }

    this.acaoAtual = {
      nome: dados.nome,
      horario: dados.horario,
      limite: Number(dados.limite),
      participantes: [],
      canal: interaction.channel
    };

    const embed = new EmbedBuilder()
      .setTitle("🎯 AÇÃO RP — NINE")
      .setColor("#6a0dad")
      .addFields(
        { name: "Ação", value: dados.nome, inline: true },
        { name: "Horário", value: dados.horario, inline: true },
        { name: "Vagas", value: `0 / ${dados.limite}` },
        { name: "Escalação", value: "—" }
      )
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("acao_entrar")
        .setLabel("Entrar na ação")
        .setStyle(ButtonStyle.Primary)
    );

    const msg = await interaction.channel.send({
      content: "@everyone",
      embeds: [embed],
      components: [row]
    });

    this.acaoAtual.message = msg;
  }

  async entrar(interaction) {
    const acao = this.acaoAtual;
    if (!acao) {
      return interaction.reply({
        content: "❌ Não há ação ativa.",
        ephemeral: true
      });
    }

    if (acao.participantes.includes(interaction.user.id)) {
      return interaction.reply({
        content: "⚠️ Você já está na escalação.",
        ephemeral: true
      });
    }

    if (acao.participantes.length >= acao.limite) {
      return interaction.reply({
        content: "❌ Ação cheia.",
        ephemeral: true
      });
    }

    acao.participantes.push(interaction.user.id);

    const lista = acao.participantes
      .map((id, i) => `${i + 1}. <@${id}>`)
      .join("\n");

    const embed = EmbedBuilder.from(acao.message.embeds[0])
      .spliceFields(2, 2,
        { name: "Vagas", value: `${acao.participantes.length} / ${acao.limite}` },
        { name: "Escalação", value: lista }
      );

    await acao.message.edit({ embeds: [embed] });

    return interaction.reply({
      content: "✅ Você entrou na ação.",
      ephemeral: true
    });
  }

  finalizar(ganhou) {
    if (!this.acaoAtual) return;

    this.ranking.total++;
    ganhou ? this.ranking.vitorias++ : this.ranking.derrotas++;

    this.client.logger.logAcao({
      nome: this.acaoAtual.nome,
      horario: this.acaoAtual.horario,
      participantes: this.acaoAtual.participantes.map(id => `<@${id}>`),
      resultado: ganhou ? "VITÓRIA" : "DERROTA"
    });

    this.acaoAtual.message.edit({ components: [] }).catch(() => {});
    this.acaoAtual = null;
  }
}
