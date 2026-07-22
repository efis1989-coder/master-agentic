import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import { Callout } from "../../components/Callout";
import { Mermaid } from "../../components/Mermaid";
import { course } from "../../content";
import { getLastLocation } from "../../db/appStateRepo";
import styles from "./HomePage.module.css";

// A layer stack, not a hierarchy: this course sits just above the seam, and each
// layer above it is a deliberate scope decision (see "What this deliberately
// leaves out" below) rather than an oversight.
const scopeMapDiagram = `graph TD
    R["Research-adjacent frontier<br/>touched via ops, not science"]
    MOD["Modalities<br/>mostly absent"]
    FW["Framework / implementation layer<br/>excluded — vendor-neutral by design"]
    CR["Craft layer<br/>lightly touched — the biggest practical gap"]
    TH["★ This course — the judgment layer<br/>decide · spec · govern · defend"]
    SEAM["Below the seam — model internals<br/>excluded, correctly"]

    R --> MOD --> FW --> CR --> TH --> SEAM

    style R fill:#dbe9ff
    style MOD fill:#ffd6d6
    style FW fill:#eceef2
    style CR fill:#fff9e0
    style TH fill:#2f6df6,color:#ffffff,stroke:#1f57d6,stroke-width:2px
    style SEAM fill:#e8f5e9`;

/**
 * Course overview / landing. Shows a "continue where you left off" banner when a
 * prior reading location exists, who the course fits and how it's positioned,
 * the map (Parts → chapters), and entry points.
 */
export function HomePage(): React.JSX.Element {
  const first = course.chapters[0];
  const last = useLiveQuery(getLastLocation);
  const resume = last?.chapterId ? course.byId.get(last.chapterId) : undefined;

  return (
    <div>
      <section className={styles.hero}>
        <h1>Production Agentic Systems</h1>
        <p className={styles.lede}>
          A failure-driven, doctrine-anchored curriculum on designing, operating, and governing
          agentic systems — read it like a book, then prove it with self-tests, spaced review, and a
          mock certification exam.
        </p>

        {resume && (
          <Link to={`/read/${resume.id}`} className={styles.resume}>
            <span className={styles.resumeLabel}>Continue where you left off</span>
            <span className={styles.resumeTitle}>
              {resume.number} {resume.title}
            </span>
          </Link>
        )}

        {!resume && (
          <ul className={styles.intro}>
            <li>Read chapters in order, or jump around using the map</li>
            <li>Select any text to highlight it and attach a margin note</li>
            <li>Self-test with exercises, then lock it in with spaced review</li>
            <li>The concept map and doctrine glossary show how it all connects</li>
          </ul>
        )}

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statNum}>{course.chapters.length}</span>
            <span className={styles.statLabel}>chapters</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>{course.parts.length}</span>
            <span className={styles.statLabel}>parts</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>{course.capstones.length}</span>
            <span className={styles.statLabel}>capstones</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>{course.exam.totalQuestions}</span>
            <span className={styles.statLabel}>exam questions</span>
          </div>
        </div>

        <div className={styles.cta}>
          {first && (
            <Link to={`/read/${first.id}`} className={styles.ctaPrimary}>
              Start with {first.number} {first.title} →
            </Link>
          )}
        </div>
      </section>

      <section className={styles.infoSection}>
        <h2>Who this is for</h2>
        <p className={styles.lede}>
          This is a systems-judgment and doctrine course, not an implementation bootcamp. It's built
          for the person who has to decide, spec, govern, and defend production agentic systems
          without writing the production code themselves — senior product leaders, founders,
          technical executives, and whoever ends up the responsible adult in the room on a regulated
          or high-stakes build. You already know roughly what an LLM is; this course does not teach
          you to build one.
        </p>
        <div className={styles.fitGrid}>
          <div className={`${styles.fitCol} ${styles.fitYes}`}>
            <h3>Fits</h3>
            <ul>
              <li>
                Senior product leaders and founders accountable for a production agentic system
              </li>
              <li>Technical executives who must govern a build they don't personally code</li>
              <li>The "responsible adult in the room" on a regulated or high-stakes rollout</li>
              <li>
                Anyone who has to hold engineers and vendors to a standard they can articulate, not
                a vibe
              </li>
            </ul>
          </div>
          <div className={`${styles.fitCol} ${styles.fitNo}`}>
            <h3>Doesn't fit</h3>
            <ul>
              <li>ML researchers who want to train or fine-tune models</li>
              <li>Engineers hunting copy-paste framework tutorials</li>
              <li>Absolute beginners with no LLM context at all</li>
              <li>
                Anyone after prompt-engineering craft tricks — used constantly here, never taught as
                a discipline
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className={styles.infoSection}>
        <h2>How this is positioned</h2>
        <p className={styles.lede}>
          Three adjacent tracks come up often enough to name directly. Each optimizes a different
          axis, and this course sits deliberately off all three.
        </p>
        <div className={styles.dataTableWrap}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th scope="col">Reference point</th>
                <th scope="col">What it optimizes for</th>
                <th scope="col">Where this course sits instead</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Claude Academy / Anthropic enablement</td>
                <td>
                  Product-and-tool mechanics: driving Claude, Claude Code, MCP, the API, prompt
                  patterns.
                </td>
                <td>
                  Vendor-neutral doctrine — Claude and MCP appear as the worked example of a
                  principle, never as the subject. Hands-on product mechanics and API/SDK specifics
                  are under-covered, on purpose.
                </td>
              </tr>
              <tr>
                <td>An Anthropic certificate / formal credential</td>
                <td>Breadth of factual product-and-policy knowledge, with an accredited stamp.</td>
                <td>
                  A judgment-and-design assessment — capstones plus a scenario exam. Arguably harder
                  and more transferable, but unaccredited, and it doesn't test rote product-feature
                  recall.
                </td>
              </tr>
              <tr>
                <td>An "LLM expert" / ML-depth track</td>
                <td>
                  The science: transformers, attention, training, RLHF, fine-tuning, inference
                  optimization, interpretability.
                </td>
                <td>
                  The model as a component with known properties, handled below the seam. Vendor RL
                  diligence (Ch. 5.5) is covered from the buyer's chair, not the builder's.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.infoSection}>
        <h2>What this deliberately leaves out</h2>
        <p className={styles.lede}>
          Every curriculum is a bet about what not to teach. Laid out by layer, from the model's
          internals up to the research frontier:
        </p>
        <Mermaid code={scopeMapDiagram} />
        <div className={styles.dataTableWrap}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th scope="col">Layer</th>
                <th scope="col">Status</th>
                <th scope="col">Specifics</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Below the seam — model internals</td>
                <td>Excluded, correctly</td>
                <td>
                  Attention mechanics, tokenization and embeddings, the training lifecycle
                  (pretraining → SFT → RLHF/DPO/constitutional), quantization, KV-cache, speculative
                  decoding, serving-layer latency. Referenced as properties throughout — the box is
                  never opened.
                </td>
              </tr>
              <tr>
                <td>The craft layer</td>
                <td>Lightly touched — the biggest practical gap</td>
                <td>
                  Retrieval as an architecture (chunking, hybrid search, rerankers, GraphRAG) beyond
                  the context-engineering treatment in Ch. 2.2 and Ch. 5.2; the
                  fine-tune-vs-RAG-vs-context decision as an explicit lever; prompt engineering as a
                  repeatable discipline rather than an assumed skill.
                </td>
              </tr>
              <tr>
                <td>The framework / implementation layer</td>
                <td>Excluded by the vendor-neutral stance</td>
                <td>
                  LangGraph, LlamaIndex, CrewAI, AutoGen, DSPy. Intentional — go get it elsewhere.
                </td>
              </tr>
              <tr>
                <td>Modalities</td>
                <td>Mostly absent</td>
                <td>
                  Voice agents, vision/multimodal pipelines, and computer-use/browser agents as a
                  distinct architectural class with its own containment problem. The likeliest gap
                  to become load-bearing within a year.
                </td>
              </tr>
              <tr>
                <td>The research-adjacent frontier</td>
                <td>Touched via ops, not science</td>
                <td>
                  Strong eval operations (Ch. 4.2) but not eval science; interpretability as a
                  debugging tool; formal verification of agent behavior; agent-to-agent protocols
                  beyond MCP. The honest edge of the map.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <Callout type="note">
          <p>
            <strong>Net:</strong> the curriculum is complete and internally coherent for its actual
            thesis — governing production agentic platforms as a decision-maker. What it misses
            splits into three buckets: deliberately below the seam (right to omit), vendor-specific
            (right to omit), and three real candidates for a future module — the retrieval/RAG
            stack, the fine-tune/RAG/context decision lever, and computer-use/browser agents as a
            contained modality.
          </p>
        </Callout>
      </section>

      {course.parts.map((part) => (
        <section key={part.part} className={styles.part}>
          <div className={styles.partHead}>
            <h2>
              Part {part.part} — {part.name}
            </h2>
            <span>{part.chapters.length} chapters</span>
          </div>
          <ul className={styles.chapters}>
            {part.chapters.map((ch) => (
              <li key={ch.id}>
                <Link to={`/read/${ch.id}`} className={styles.chapterRow}>
                  <span className={styles.num}>{ch.number}</span>
                  <span>{ch.title}</span>
                  <span className={styles.domain}>{ch.domain}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
