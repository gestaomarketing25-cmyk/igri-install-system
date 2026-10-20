# IGRI Telecom — Sistema de Instalações

Sistema web em Next.js para organizar o fluxo completo de instalação:

1. **Atendimento (sem login)**: cadastra o briefing do cliente, envia as respostas para análise e recebe protocolo + PDF de instruções.
2. **Técnicos (login individual)**: cada técnico vê apenas as ordens atribuídas a ele, executa checklist, registra o ponto real do roteador e envia fotos obrigatórias.
3. **Administrador (login)**: acompanha todos os briefings, atribui técnicos, visualiza recomendação, checklist, fotos e conclusão.

## Stack

- Next.js + TypeScript
- Supabase Free: PostgreSQL, Auth e Storage
- Vercel para hospedagem
- OpenAI Responses API **opcional** para análise automática. Sem chave da OpenAI, o sistema usa regras técnicas internas e continua funcionando.

## 1. Criar projeto gratuito no Supabase

1. Crie um projeto em Supabase.
2. No **SQL Editor**, execute `supabase/schema.sql`.
3. Copie:
   - Project URL
   - anon/public key
   - service_role key
4. O SQL cria também o bucket privado `installation-photos`.

## 2. Variáveis de ambiente

Copie `.env.example` para `.env.local`.

```bash
cp .env.example .env.local
```

Preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=... # opcional
OPENAI_MODEL=gpt-6-luna
```

### Senhas iniciais

As senhas **não são colocadas no código nem devem ir para o GitHub**. Preencha localmente:

```env
SEED_WANDERSON_PASSWORD=...
SEED_ERIBALDO_PASSWORD=...
SEED_GABRIEL_PASSWORD=...
SEED_CARLOS_PASSWORD=...
SEED_ADMIN_PASSWORD=...
```

Use as senhas definidas para sua operação.

## 3. Criar usuários

```bash
npm install
npm run seed:users
```

O script cria:

- `wanderson` — técnico
- `eribaldo` — técnico
- `gabriel` — técnico
- `carlos` — técnico
- `admin` — administrador

## 4. Rodar localmente

```bash
npm run dev
```

Abra `http://localhost:3000`.

## 5. Fluxo do sistema

### Atendimento

Rota: `/atendimento`

- Sem login.
- Novo briefing do cliente.
- Pergunta sobre IPTV/TV Box.
- Ao marcar que não utiliza IPTV, os campos adicionais ficam ocultos.
- Cada equipamento escolhido para cabeamento recebe seu próprio campo de cômodo.
- A análise recomenda:
  - local do roteador;
  - justificativa;
  - altura;
  - se a preferência do cliente deve ou não ser seguida;
  - proximidade com TV quando isso não prejudicar o Wi-Fi;
  - aparelhos a cabear;
  - pontos que o técnico precisa testar.
- Gera PDF de instruções.
- Para consultar o serviço realizado sem login, a atendente usa **protocolo + últimos 4 dígitos do telefone**. Isso evita expor a lista completa de clientes em uma página pública.

### Técnico

Rota: `/tecnico`

- Login individual.
- Vê apenas OS atribuídas ao próprio técnico.
- Resumo objetivo da recomendação.
- Checklist obrigatório.
- Registra:
  - local real do roteador;
  - altura aproximada;
  - desvio da recomendação e motivo;
  - observações técnicas.
- Fotos obrigatórias:
  - modem/roteador instalado;
  - cada equipamento que deveria ser cabeado.
- A OS não pode ser concluída sem checklist e fotos obrigatórias.

### Administrador

Rota: `/admin`

- Login de administrador.
- Dashboard por status.
- Visualiza todas as OS.
- Atribui técnico.
- Visualiza briefing original, análise, execução, checklist e fotos.

## 6. Publicar no GitHub

```bash
git init
git add .
git commit -m "Sistema IGRI de instalações"
git branch -M main
git remote add origin SEU_REPOSITORIO
git push -u origin main
```

**Nunca envie `.env.local` para o GitHub.** O `.gitignore` já protege esse arquivo.

## 7. Publicar na Vercel

1. Importe o repositório GitHub na Vercel.
2. Adicione as variáveis:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY` (opcional)
   - `OPENAI_MODEL`
3. Faça o deploy.

As variáveis `SEED_*` são necessárias apenas para executar o script de criação/atualização dos usuários. Não precisam permanecer na Vercel depois que as contas forem criadas.

## Segurança / LGPD

- Fotos ficam em bucket **privado** no Supabase.
- URLs de fotos são temporárias e assinadas.
- Técnicos só acessam OS atribuídas a eles.
- Administrador acessa o conjunto completo.
- A área sem login não permite listar clientes; a consulta exige protocolo + 4 dígitos do telefone.
- Nunca deixe a `SUPABASE_SERVICE_ROLE_KEY` exposta no navegador.
- Troque senhas padrão periodicamente e evite senhas reutilizadas em outros sistemas.

## IA

O sistema suporta OpenAI via Responses API. A chamada ocorre somente no servidor. Se não houver `OPENAI_API_KEY`, um analisador determinístico aplica as mesmas regras básicas para que o sistema permaneça operacional.

A recomendação é sempre tratada como **preliminar**. O técnico precisa validar presencialmente cobertura, obstáculos, energia, ventilação e passagem dos cabos antes de definir o ponto final.
