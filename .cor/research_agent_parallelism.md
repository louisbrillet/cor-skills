# COR Research — parallélisme des agents

> Écarts par rapport au skill `cor-research` : aucune phase Think n'a précédé (la question du chat sert de contexte). Les sources ont été récupérées par URL connue, sans moteur de recherche : ce n'est pas une revue systématique.

## Decision summary
- Recommended approach: garder l'implémentation séquentielle dans `cor-code` (un exécutant, une tâche). Réserver le parallélisme au travail en lecture seule et indépendant (recherche, revue).
- Why it fits this project: les gains mesurés du parallélisme viennent de tâches décomposables et en lecture ; les tâches de code sont le plus souvent dépendantes, et `cor-code` repose sur un checkpoint et un commit par tâche.
- Confidence: MEDIUM. Les études mesurées datent de 2025 à avril 2026 et portent sur des modèles antérieurs à ceux de cette session. Aucune étude contrôlée trouvée sur des sous-agents de code en parallèle dans les harnais actuels.

## Project evidence
- Goal inherited from Think: savoir si le parallélisme d'agents fonctionne en pratique, sur des faits mesurés.
- Scope boundaries: sous-agents et équipes d'agents pour du code. Hors périmètre : parallélisme humain (plusieurs sessions pilotées à la main).
- Acceptance criteria: non définis (pas de Think).
- Resolved versions: plugin `cor` 0.2.0, branche `feat/cor-code-delegation`.
- Existing usages and primitives:
  - `plugins/cor/skills/cor-code/SKILL.md:418` : « One task at a time. Never implement multiple tasks in a single run. »
  - `plugins/cor/skills/cor-code/SKILL.md:370` : un commit par tâche.
  - `plugins/cor/skills/cor-code/references/delegation.md:54` : jamais d'exécutants en parallèle.
  - `plugins/cor/skills/cor-plan/SKILL.md:66` : les tâches sont ordonnées par dépendance ; le plan ne marque pas les tâches indépendantes.
- Constraints inherited from Think: aucune.

## Findings

Type de preuve : **M** = mesure contrôlée publiée, **V** = chiffre d'éditeur sur évaluation interne, **D** = documentation produit, **O** = opinion de praticien.

| Claim | Evidence | Applicability |
| --- | --- | --- |
| **M** Sur 260 configurations (6 benchmarks, 5 architectures, 3 familles de modèles), l'écart du multi-agent par rapport à un agent seul va de +80,8 % (raisonnement financier décomposable, coordination centralisée) à -70,0 % (planification séquentielle, agents indépendants). | [Kim et al., arXiv 2512.08296v3](https://arxiv.org/abs/2512.08296), 8 avril 2026 | Le résultat dépend de la structure de la tâche, pas du nombre d'agents. |
| **M** Taux de succès moyen : agent seul 0,466 ; indépendants 0,370 ; décentralisé 0,477 ; centralisé 0,463 ; hybride 0,452. | idem, table 5 | En moyenne, aucun gain net. |
| **M** Amplification des erreurs par rapport à un agent seul : 17,2 pour des agents indépendants sans vérification, 4,4 avec coordination centralisée. | idem, table 5 | Des exécutants parallèles sans validation centrale propagent leurs erreurs. |
| **M** Quand l'agent seul dépasse environ 45 % de réussite, ajouter des agents donne des rendements négatifs. | idem | Les modèles forts gagnent le moins. |
| **M** SWE-bench Verified, 20 instances : Claude Sonnet 4.5 seul 75 %, centralisé 70 %, indépendants 55 % ; GPT-5 nano seul 5 %, centralisé 35 %. Intervalles de confiance à 95 % larges et qui se chevauchent. | idem, table 16 | Indicatif seulement (n = 20). Aucune architecture multi-agent ne bat nettement un modèle fort seul sur du code. |
| **M** Orchestrateur fort avec sous-agents plus faibles : sous la performance du modèle fort utilisé seul, dans toutes les combinaisons testées (BrowseComp-Plus). | idem, table 12 | Navigation web, pas code. Concerne aussi la délégation Fable vers Sonnet : elle échange de la qualité contre du coût. |
| **M** 7 frameworks multi-agents open source : taux d'échec de 41 % à 86,7 % ; 1 642 traces annotées, 14 modes d'échec en 3 familles (conception du système, désalignement entre agents, vérification). | [Cemri et al., arXiv 2503.13657v3](https://arxiv.org/abs/2503.13657), 26 octobre 2025 | Frameworks à rôles (MetaGPT, ChatDev, etc.) avec GPT-4o et Claude 3.7 ; pas les sous-agents des harnais actuels. |
| **V** Opus 4 en chef avec sous-agents Sonnet 4 : +90,2 % par rapport à Opus 4 seul sur une évaluation interne de recherche. Environ 15 fois plus de tokens qu'un chat, 4 fois pour un agent seul. | [Anthropic, 13 juin 2025](https://www.anthropic.com/engineering/multi-agent-research-system) | Recherche d'information, pas code. Évaluation interne non reproductible. |
| **V** L'usage de tokens explique à lui seul 80 % de la variance de performance sur BrowseComp. | idem | Le gain vient surtout du volume de tokens dépensés. |
| **V** « most coding tasks involve fewer truly parallelizable tasks than research, and LLM agents are not yet great at coordinating and delegating to other agents in real time » | idem | Limite admise par l'éditeur lui-même. |
| **D** Les équipes d'agents de Claude Code sont expérimentales et désactivées par défaut. Pour les tâches séquentielles, les modifications d'un même fichier ou les travaux avec beaucoup de dépendances, une session unique ou des sous-agents sont plus efficaces. | [Claude Code, agent teams](https://code.claude.com/docs/en/agent-teams) | État actuel du produit. |
| **D** Deux coéquipiers qui modifient le même fichier s'écrasent. L'état des tâches peut être en retard et bloquer les tâches dépendantes. | idem | Risques concrets du code en parallèle. |
| **D** Environ 7 fois plus de tokens qu'une session standard quand les coéquipiers sont en mode plan. | [Claude Code, costs](https://code.claude.com/docs/en/costs) | Coût. |
| **D** Les sous-agents peuvent tourner chacun dans son worktree (`isolation: worktree`) pour que les modifications parallèles ne se heurtent pas. | [Claude Code, worktrees](https://code.claude.com/docs/en/worktrees) | Isole les fichiers ; ne règle ni les décisions contradictoires ni la fusion. |
| **O** Des sous-agents parallèles prennent des décisions implicites contradictoires faute de contexte partagé ; l'architecture est jugée fragile. | [Cognition, 12 juin 2025](https://cognition.ai/blog/dont-build-multi-agents) | Argument avec exemple, sans mesure. |

## Options considered
| Option | Fit | Maintenance / risk | Decision |
| --- | --- | --- | --- |
| Implémentation séquentielle, un exécutant par tâche (état actuel de la branche) | Compatible checkpoint et commit par tâche | Aucun changement | ADOPT |
| Parallélisme limité au travail en lecture seule : questions de `cor-research`, mesures de `cor-review` | Correspond aux cas où un gain est mesuré | Coût en tokens multiplié ; synthèse à faire par l'orchestrateur | FALLBACK |
| Tâches d'implémentation en parallèle | Les tâches d'un plan COR sont ordonnées par dépendance | Conflits de fichiers, décisions contradictoires, reprise après crash à réécrire ; aucun gain mesuré sur du code avec un modèle fort | REJECT |

## Plan inputs
- Components or files likely affected: aucun pour l'option retenue.
- Version-specific APIs or migration steps: aucune.
- New dependency and version policy, if any: aucune.
- Risks and mitigations: si le parallélisme en lecture est ajouté un jour, garder la validation chez l'orchestrateur (l'amplification d'erreurs est la plus forte sans vérification centrale).
- Validation and test implications: toute introduction de parallélisme devrait être mesurée sur les évaluations du dépôt, à tokens comparables, avant d'être activée par défaut.
- Decisions cor-plan must preserve: une tâche à la fois dans `cor-code`.

## Unresolved questions
- Les modèles de fin 2026 coordonnent-ils mieux que ceux mesurés ? Aucune mesure trouvée.
- Gain réel de temps d'horloge du parallélisme sur du code : non mesuré dans les sources lues.
- La table 12 (orchestrateur fort, sous-agents faibles) se transpose-t-elle au code ? Non testé dans l'étude.

## Sources
- [Towards a Science of Scaling Agent Systems, arXiv 2512.08296v3](https://arxiv.org/abs/2512.08296), accessed 2026-11-20
- [Why Do Multi-Agent LLM Systems Fail?, arXiv 2503.13657v3](https://arxiv.org/abs/2503.13657), accessed 2026-11-20
- [How we built our multi-agent research system, Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system), accessed 2026-11-20
- [Don't Build Multi-Agents, Cognition](https://cognition.ai/blog/dont-build-multi-agents), accessed 2026-11-20
- [Claude Code, agent teams](https://code.claude.com/docs/en/agent-teams), accessed 2026-11-20
- [Claude Code, costs](https://code.claude.com/docs/en/costs), accessed 2026-11-20
- [Claude Code, worktrees](https://code.claude.com/docs/en/worktrees), accessed 2026-11-20
