import type { Course } from "./types";
import ExprTree from "../visuals/ExprTree";
import TruthTable from "../visuals/TruthTable";
import LogicLab from "../visuals/LogicLab";
import Venn3 from "../visuals/Venn3";
import CardinalityLab from "../visuals/CardinalityLab";
import SetRelations from "../visuals/SetRelations";
import CartesianGrid from "../visuals/CartesianGrid";
import FunctionClassify from "../visuals/FunctionClassify";
import CompositionMachine from "../visuals/CompositionMachine";
import InverseReflect from "../visuals/InverseReflect";
import WellDefined from "../visuals/WellDefined";
import ModClock from "../visuals/ModClock";
import PacketCipher from "../visuals/PacketCipher";
import ExpectedDie from "../visuals/ExpectedDie";
import RngStepper from "../visuals/RngStepper";
import DiceStats from "../visuals/DiceStats";
import SequenceStairs from "../visuals/SequenceStairs";
import GraphBuilder from "../visuals/GraphBuilder";
import {
  ArrowsLeftRight,
  Clock,
  DiceFive,
  Function,
  Graph,
  GridFour,
  Intersect,
  LockKey,
  Shuffle,
  Stairs,
  Table,
} from "@phosphor-icons/react";

export const discrete: Course = {
  id: "discrete",
  title: "Discrete Structures",
  term: "Spring 2026",
  tagline: "Logic, sets, functions, number theory, probability and graphs.",
  hue: 262,
  units: [
    {
      id: "logic",
      label: "Module 1",
      title: "Logic & Arithmetic",
      summary: "How expressions are evaluated, and how true and false combine into bigger statements.",
      sections: [
        {
          id: "arithmetic",
          title: "Arithmetic",
          thumb: { tex: "\\boldsymbol{\\begin{matrix}\\color{#009CDE}{+} & \\color{#FF8B22}{-} \\\\ \\color{#2E9E4F}{\\times} & \\color{#B565E0}{\\div}\\end{matrix}}" },
          Visual: ExprTree,
          visualHint: "Pick an example or type your own, then press Evaluate next. Each node lights up in the order Python computes it.",
          body: [
            "An expression is evaluated by precedence, not left to right. In Python, ** binds tightest (and groups right to left, so 2 ** 3 ** 2 is 2 ** 9), then * / // %, then + and −, then comparisons, then not, and, or.",
            "// is floor division: it rounds toward negative infinity, so −7 // 2 is −4, not −3. % gives the matching remainder, which always has the sign of the divisor: −7 % 3 is 2.",
            "and and or short-circuit. If the left side of and is false, or the left side of or is true, the right side is never evaluated. In the tree, that whole branch greys out.",
          ],
          checkpoints: [
            {
              prompt: "What is 17 // 5 - 2 >= 17 % 5?",
              options: ["True (1)", "False (0)"],
              answer: 1,
              explanation: "17 // 5 = 3, so the left side is 1. 17 % 5 = 2, and 1 ≥ 2 is False. Load Ex 1 to watch it step by step.",
            },
            {
              prompt: "What does −7 // 2 evaluate to in Python?",
              options: ["−3", "−4", "−3.5", "4"],
              answer: 1,
              explanation: "−3.5 rounds down (toward −∞) to −4.",
            },
          ],
        },
        {
          id: "truth-tables",
          title: "Truth Tables",
          thumb: { icon: Table, color: "#E8B400" },
          Visual: TruthTable,
          visualHint: "Type any expression, or build it from the symbol keys, and the table builds itself. Click a row to follow it across.",
          body: [
            "A truth table lists every combination of true (T) and false (F) for the variables, and the value of the expression in each. With \\(n\\) variables there are \\(2^n\\) rows: 4 for P and Q, 8 once R joins, 16 with S.",
            "Each connective has a simple rule. ¬P flips P. P ∧ Q (and) is true only when both are. P ∨ Q (or) is true when at least one is. P ⊕ Q (xor) is true when exactly one is. P ↔ Q (if and only if) is true when they match. NAND (↑) and NOR (↓) are just ¬(P ∧ Q) and ¬(P ∨ Q).",
            "P → Q (implies) is the one that surprises people: it is false only when P is true and Q is false. If P is false, the promise was never tested, so P → Q counts as true.",
            "To fill in a compound expression, work from the innermost operator outward, one column at a time. The table on the right does exactly that: each step column is one operator, and the last column is the answer.",
            "Without parentheses, ¬ applies first, then ∧, ∨, ⊕, → and finally ↔. So ¬P ∨ Q means (¬P) ∨ Q. When in doubt, add parentheses.",
          ],
          checkpoints: [
            {
              prompt: "For which inputs is P → Q false?",
              options: ["P true, Q true", "P true, Q false", "P false, Q true", "P false, Q false"],
              answer: 1,
              explanation: "An implication only fails when a true premise leads to a false conclusion.",
            },
            {
              prompt: "How many rows are true for P ⊕ Q ⊕ R?",
              options: ["1", "3", "4", "7"],
              answer: 2,
              explanation: "It's true when an odd number of inputs are true: three rows with one true input, plus the all-true row.",
            },
          ],
        },
        {
          id: "logic-concepts",
          title: "Logic Concepts",
          thumb: { tex: "\\color{#D90677}{\\neg}(p \\mathbin{\\color{#009CDE}{\\land}} q)" },
          Visual: LogicLab,
          visualHint: "Load a law or type your own A and B, then change one with the buttons and watch whether the columns still match. In Quantifiers, write your own predicate and pick the domain.",
          body: [
            "Two expressions are equivalent (≡) when they have the same value in every row of their truth table. To show they are not, one row where they disagree is enough.",
            "Laws are equivalences you can use to rewrite an expression without changing its table. De Morgan's laws move a ¬ inside by flipping the connective; absorption removes a redundant term:",
            "\\[\\neg(P \\land Q) \\equiv \\neg P \\lor \\neg Q \\qquad P \\lor (P \\land Q) \\equiv P\\]",
            "Try it on the right: push a ¬ inward one step at a time, or rewrite → as ¬P ∨ Q, and A stays equivalent to what it was. Negating does change the table (every row flips), and so does taking the converse: P → Q is not equivalent to Q → P, but it is equivalent to its contrapositive ¬Q → ¬P.",
            "A tautology is true in every row, a contradiction in none, and a contingency in some. The dual of an expression swaps ∧ with ∨ and T with F; if two expressions are equivalent, so are their duals.",
            "A quantifier says how many elements of a domain must satisfy a predicate: ∀x (for all) needs every x, ∃x (there exists) needs at least one. To disprove a 'for all', one counterexample is enough. To prove a 'there exists', one witness is enough.",
            "Negating a quantifier flips it: \\(\\neg\\forall x\\, P(x) \\equiv \\exists x\\, \\neg P(x)\\). With two variables the order matters: ∀x ∃y (x + y = 0) lets y depend on x, while ∃y ∀x (x + y = 0) needs one y that works for every x.",
          ],
          checkpoints: [
            {
              prompt: "What is the negation of ∀x ∃y (x + y = 0)?",
              options: ["∀x ∃y ¬(x + y = 0)", "∃x ∀y ¬(x + y = 0)", "∃x ∃y (x + y ≠ 0)", "¬∃x ∀y (x + y = 0)"],
              answer: 1,
              explanation: "Each quantifier flips as the ¬ moves past it, and the predicate is negated at the end.",
            },
            {
              prompt: "What is the dual of P ∨ (Q ∧ T)?",
              options: ["P ∧ (Q ∨ F)", "¬P ∧ (¬Q ∨ F)", "P ∨ (Q ∧ F)", "P ∧ (Q ∨ T)"],
              answer: 0,
              explanation: "Swap ∨ ↔ ∧ and T ↔ F, and leave the variables alone.",
            },
          ],
        },
      ],
    },
    {
      id: "sets",
      label: "Module 2",
      title: "Set Theory",
      summary: "Sets are collections where only membership matters. Combine them, count them, compare them, and pair them up.",
      sections: [
        {
          id: "operations",
          title: "Set Operations",
          thumb: { icon: Intersect, color: "#009CDE" },
          Visual: Venn3,
          visualHint: "Click regions of the diagram (or the region chips) to build a selection. Every expression for it appears below.",
          body: [
            "Three overlapping circles split the universe into eight regions, and every operation just picks some of them. \\(A \\cup B\\) keeps anything touching A or B, \\(A \\cap B\\) keeps only the overlap, \\(A - B\\) keeps the part of A outside B, and \\(A^c\\) is everything outside A.",
            "Because operations are choices of regions, one shaded shape has many correct names. Click regions and watch every expression that describes your selection appear, in set notation and logic.",
          ],
          checkpoints: [
            {
              prompt: "Which expression names only the center region?",
              options: ["A ∪ B ∪ C", "A ∩ B ∩ C", "(A ∩ B) − C", "A ⊕ B ⊕ C"],
              answer: 1,
              explanation: "Only A ∩ B ∩ C stays inside all three circles. Click the center to see its other names.",
            },
          ],
        },
        {
          id: "cardinality",
          title: "Cardinality",
          thumb: { tex: "|A \\mathbin{\\color{#009CDE}{\\cup}} B|" },
          Visual: CardinalityLab,
          visualHint: "Left click a region to drop an element in, right click to take one out, then add the inclusion–exclusion terms one at a time. Below, grow a set to see its power set.",
          body: [
            "The cardinality |A| counts the distinct elements of A. Adding |A| + |B| + |C| counts overlaps more than once, so inclusion–exclusion subtracts each pairwise overlap and adds the triple overlap back:",
            "\\[\\begin{aligned} |A \\cup B \\cup C| &= |A| + |B| + |C| \\\\ &\\quad - |A \\cap B| - |A \\cap C| - |B \\cap C| \\\\ &\\quad + |A \\cap B \\cap C| \\end{aligned}\\]",
            "A set with n elements has 2ⁿ subsets, because each element is either in or out. So \\(|\\mathcal{P}(A)| = 2^{|A|}\\), and the empty set is a subset of every set.",
          ],
          checkpoints: [
            {
              prompt: "|A| = 5, |B| = 4 and |A ∩ B| = 2. What is |A ∪ B|?",
              options: ["9", "7", "11", "2"],
              answer: 1,
              explanation: "5 + 4 − 2 = 7. The two shared elements were counted twice, so one copy comes off.",
            },
          ],
        },
        {
          id: "concepts",
          title: "Set Theory Concepts",
          thumb: { tex: "A \\mathrel{\\color{#46C8B2}{\\subseteq}} B" },
          Visual: SetRelations,
          visualHint: "Pick an arrangement. The circles glide into place and the badges show which relationships hold. Switch between ∅ and { } to see both ways textbooks write the empty set.",
          body: [
            "\\(A \\subseteq B\\) means every element of A is also in B. It's a proper subset, \\(A \\subset B\\), when B has at least one element A lacks. Two sets are disjoint when their intersection is empty.",
            "The empty set ∅ is a subset of every set and disjoint from every set. But ∅ ⊆ S and ∅ ∈ S are different claims: the second needs ∅ itself to be an element.",
          ],
          checkpoints: [
            {
              prompt: "Which statement is true for every set S?",
              options: ["∅ ∈ S", "∅ ⊆ S", "S ⊂ S", "S ∩ ∅ = S"],
              answer: 1,
              explanation: "∅ has no element that could fail to be in S, so ∅ ⊆ S always holds.",
            },
          ],
        },
        {
          id: "cartesian",
          title: "Cartesian Products",
          thumb: { icon: GridFour, color: "#46C8B2" },
          Visual: CartesianGrid,
          visualHint: "Pick a pair of example sets and toggle their elements. Build A × B, B × A, A × A or B × B, view it as a grid or a set of pairs, and click pairs to pick out a relation.",
          body: [
            "A × B is the set of every ordered pair (a, b) with a from A and b from B. Lay A down one side and B across the top, and each cell is one pair, so \\(|A \\times B| = |A| \\cdot |B|\\).",
            "Order matters: (a, 1) and (1, a) are different pairs, so A × B ≠ B × A in general. And A × ∅ = ∅, because there is nothing to pair with.",
          ],
          checkpoints: [
            {
              prompt: "If |A| = 3 and B = ∅, what is |A × B|?",
              options: ["3", "0", "1", "Undefined"],
              answer: 1,
              explanation: "3 × 0 = 0. With no second coordinate to choose, no pair can be formed.",
            },
          ],
        },
      ],
    },
    {
      id: "functions",
      label: "Module 3",
      title: "Functions",
      summary: "Rules that assign each input exactly one output, and what that guarantees.",
      sections: [
        {
          id: "classification",
          title: "Function Classification",
          thumb: { icon: ArrowsLeftRight, color: "#009CDE" },
          Visual: FunctionClassify,
          visualHint: "Draw arrows in the diagram, or switch to the graph and drag the horizontal line across a rule on ℕ, ℤ or ℝ.",
          body: [
            "Injective (one-to-one): different inputs never share an output. Surjective (onto): every element of the codomain is hit. Bijective: both at once.",
            "The same formula can change category when the domain changes. \\(f(x) = 2x + 1\\) is a bijection on \\(\\mathbb{R}\\) but only injective on \\(\\mathbb{Z}\\), because it never lands on an even integer.",
            "On a graph, a horizontal line that crosses twice breaks injectivity, and a level the graph never reaches breaks surjectivity.",
          ],
          checkpoints: [
            {
              prompt: "f: ℤ → ℤ, f(x) = 2x + 1 is…",
              options: ["bijective", "injective only", "surjective only", "neither"],
              answer: 1,
              explanation: "Distinct inputs give distinct outputs, but only odd integers are reached.",
            },
            {
              prompt: "f: ℝ → ℝ, f(x) = x² is…",
              options: ["bijective", "injective only", "surjective only", "neither"],
              answer: 3,
              explanation: "x and −x collide, and negative outputs are never reached.",
            },
          ],
        },
        {
          id: "operations",
          title: "Function Operations",
          thumb: { tex: "g \\mathbin{\\color{#FF8B22}{\\circ}} f" },
          Visual: CompositionMachine,
          visualHint: "Choose f and g, slide the input, and swap the order to compare g ∘ f with f ∘ g.",
          body: [
            "\\[(g \\circ f)(x) = g(f(x))\\]",
            "This runs f first and feeds its output to g, so read a composition right to left.",
            "Composition is associative but usually not commutative: g ∘ f and f ∘ g are different machines.",
          ],
          checkpoints: [
            {
              prompt: "f(x) = 2x + 1 and g(x) = x². What is (g ∘ f)(3)?",
              options: ["49", "19", "13", "36"],
              answer: 0,
              explanation: "f(3) = 7, then g(7) = 49. The other order, f(g(3)), gives 19.",
            },
          ],
        },
        {
          id: "inverses",
          title: "Inverse Functions",
          thumb: { tex: "f^{\\color{#FF8B22}{-1}}" },
          Visual: InverseReflect,
          visualHint: "Pick a function and reflect it across y = x. When f isn't one-to-one, the reflection fails.",
          body: [
            "\\(f^{-1}\\) undoes f: \\(f^{-1}(f(x)) = x\\). Only bijections have inverses, since each output must come from exactly one input.",
            "To find f⁻¹, write y = f(x) and solve for x. Graphically, the inverse is the reflection of f across the line y = x.",
          ],
          checkpoints: [
            {
              prompt: "What is the inverse of f(x) = (x − 1) / 3?",
              options: ["3x − 1", "3x + 1", "(x + 1) / 3", "1 / (3x − 1)"],
              answer: 1,
              explanation: "y = (x − 1)/3 → 3y = x − 1 → x = 3y + 1.",
            },
          ],
        },
        {
          id: "theory",
          title: "Function Theory",
          thumb: { icon: Function, color: "#8E6CDE" },
          Visual: WellDefined,
          visualHint: "Choose a rule on fractions. The same number, written four ways, goes through it; mismatched outputs flash red.",
          body: [
            "A rule is well defined when equal inputs always give equal outputs, and every input gets one. Rules on fractions are the classic trap: 1/2 and 2/4 are the same number, so a rule may not depend on how it's written.",
            "Range is the set of outputs actually reached, which can be smaller than the codomain. The identity function maps every x to itself, and composing with it changes nothing.",
          ],
          checkpoints: [
            {
              prompt: "If g ∘ f is injective, which must be injective?",
              options: ["f", "g", "both f and g", "neither"],
              answer: 0,
              explanation: "If f sent two inputs to the same place, g ∘ f would too. g can still collide on values f never reaches.",
            },
          ],
        },
      ],
    },
    {
      id: "crypto",
      label: "Module 4",
      title: "Cryptography",
      summary: "Modular arithmetic, and the simple cryptosystem built on it.",
      sections: [
        {
          id: "modular",
          title: "Modular Arithmetic",
          thumb: { icon: Clock, color: "#FF8B22" },
          Visual: ModClock,
          visualHint: "Drag a (try negatives) and n. The clock hand walks to a mod n; the number line shows a = n·q + r.",
          body: [
            "\\(a \\bmod n\\) is the remainder \\(r\\) in \\(a = nq + r\\) with \\(0 \\le r < n\\), and \\(q = \\lfloor a / n \\rfloor\\) (Python's a // n). Picture a clock with n positions: negative numbers walk backwards, so \\(-3 \\bmod 7 = 4\\).",
            "Chained operations can be reduced at every step, and the same works for multiplication:",
            "\\[(a + b) \\bmod n = \\big((a \\bmod n) + (b \\bmod n)\\big) \\bmod n\\]",
          ],
          checkpoints: [
            {
              prompt: "What is −10 mod 4?",
              options: ["−2", "2", "6", "0"],
              answer: 1,
              explanation: "−10 = 4·(−3) + 2, and the remainder must be in 0…3.",
            },
            {
              prompt: "What is −17 // 5?",
              options: ["−3", "−4", "3", "−3.4"],
              answer: 1,
              explanation: "−3.4 floors to −4, and then −17 % 5 = 3.",
            },
          ],
        },
        {
          id: "cryptosystem",
          title: "Simple Cryptosystem",
          thumb: { icon: LockKey, color: "#D90677" },
          Visual: PacketCipher,
          visualHint: "Type a message, choose the packet size, N and K. Click a packet to see its arithmetic.",
          body: [
            "Letters become numbers: A = 0 through Z = 25, and _ = 26. With packet size s, each group of s letters is read as one base-27 number p, padding the end with _.",
            "Encrypt each packet as \\(c = pK \\bmod N\\). Decrypt with the inverse key: \\(p = cK^{-1} \\bmod N\\). That needs \\(\\gcd(K, N) = 1\\) so \\(K^{-1}\\) exists, and N larger than any packet so p comes back unchanged.",
          ],
          checkpoints: [
            {
              prompt: "With packet size 2, what number p is the packet \"BA\"?",
              options: ["10", "27", "1", "28"],
              answer: 1,
              explanation: "B = 1 and A = 0, so p = 1·27 + 0 = 27.",
            },
            {
              prompt: "Why must gcd(K, N) = 1?",
              options: ["To make c smaller", "So K has an inverse mod N", "So N is prime", "To pad the message"],
              answer: 1,
              explanation: "Decryption multiplies by K⁻¹, which exists exactly when K and N share no factor.",
            },
          ],
        },
      ],
    },
    {
      id: "stochastic",
      label: "Module 5",
      title: "Stochastic Computing",
      summary: "Expected value, spread, and how computers fake randomness.",
      sections: [
        {
          id: "expected",
          title: "Expected Value",
          thumb: { icon: DiceFive, color: "#009CDE" },
          Visual: ExpectedDie,
          visualHint: "Drag the bars to set each outcome's probability, then roll. The running average settles on E[X].",
          body: [
            "The expected value is the long-run average of many repeats: the probability-weighted sum of every value X can take,",
            "\\[\\mathrm{E}[X] = \\sum_{x} x\\,P(X = x)\\]",
            "It needn't be a value X can actually take: a fair die has \\(\\mathrm{E}[X] = 3.5\\).",
            "Expectation is linear: \\(\\mathrm{E}[X + Y] = \\mathrm{E}[X] + \\mathrm{E}[Y]\\), even when X and Y depend on each other. For games, use net winnings (prize minus cost) as the values.",
          ],
          checkpoints: [
            {
              prompt: "A game pays $10 with probability 0.2 and you lose $3 otherwise. What is E[X]?",
              options: ["−$0.40", "$0.40", "$7.00", "−$3.00"],
              answer: 0,
              explanation: "10·0.2 + (−3)·0.8 = 2 − 2.4 = −0.40.",
            },
          ],
        },
        {
          id: "rng",
          title: "Random Number Generation",
          thumb: { icon: Shuffle, color: "#46C8B2" },
          Visual: RngStepper,
          visualHint: "Pick a generator and step it. LCG values hop around a ring of m positions until the cycle closes.",
          body: [
            "Middle square: square the number, pad it to twice the digits, and keep the middle digits. It often collapses into 0 or a short loop.",
            "A linear congruential generator repeats \\(x_{n+1} = (a x_n + c) \\bmod m\\), so it must cycle within \\(m\\) steps. Its period is how many values come out before the first generated value returns.",
            "An LFSR shifts a register of bits right one place per step. It outputs the rightmost bit and feeds the XOR of the tap positions in on the left.",
          ],
          checkpoints: [
            {
              prompt: "LCG with a = 5, c = 3, m = 16 and seed 7. What is the next value?",
              options: ["6", "38", "2", "10"],
              answer: 0,
              explanation: "(5·7 + 3) mod 16 = 38 mod 16 = 6. Set those values in the panel to check.",
            },
            {
              prompt: "2-digit middle square with seed 42. What comes next?",
              options: ["17", "76", "64", "42"],
              answer: 1,
              explanation: "42² = 1764, and the middle two digits are 76.",
            },
          ],
        },
        {
          id: "variance",
          title: "Standard Deviation & Variance",
          thumb: { tex: "\\color{#D90677}{\\sigma}^2" },
          Visual: DiceStats,
          visualHint: "Relabel the faces of either die, pick a statistic, and roll. The shaded band is mean ± one standard deviation.",
          body: [
            "Variance measures spread, the average squared distance from the mean μ:",
            "\\[\\mathrm{Var}(X) = \\mathrm{E}\\big[(X - \\mu)^2\\big] = \\mathrm{E}[X^2] - \\mu^2\\]",
            "The standard deviation \\(\\sigma = \\sqrt{\\mathrm{Var}(X)}\\) is in the same units as X.",
            "Relabelled dice change the outcome table, so rebuild the distribution from all 36 equally likely pairs before computing μ and σ.",
          ],
          checkpoints: [
            {
              prompt: "X = 1 for heads and 0 for tails on a fair coin. What is σ?",
              options: ["0.25", "0.5", "1", "0.707"],
              answer: 1,
              explanation: "μ = 0.5 and E[X²] = 0.5, so Var = 0.5 − 0.25 = 0.25 and σ = 0.5.",
            },
            {
              prompt: "Which statistic of two standard dice has the smallest σ?",
              options: ["Sum", "Max", "Product", "They're all equal"],
              answer: 1,
              explanation: "Max has σ ≈ 1.40, while Sum is ≈ 2.42 and Product is much larger. Compare them in the panel.",
            },
          ],
        },
      ],
    },
    {
      id: "graphs",
      label: "Module 6",
      title: "Sequences & Graph Theory",
      summary: "Patterns that grow step by step, and networks of vertices and edges.",
      sections: [
        {
          id: "sequences",
          title: "Sequences",
          thumb: { icon: Stairs, color: "#E8B400" },
          Visual: SequenceStairs,
          visualHint: "Switch sequence types and drag the parameters. Turn on Gauss pairing to see why the arithmetic sum formula works.",
          body: [
            "An arithmetic sequence adds a constant \\(d\\): \\(a_n = a_1 + (n - 1)d\\), and its sum is \\(S_n = \\frac{n(a_1 + a_n)}{2}\\). A geometric sequence multiplies by \\(r\\): \\(a_n = a_1 r^{n-1}\\).",
            "A recursive sequence defines each term from earlier ones, like Fibonacci's \\(a_n = a_{n-1} + a_{n-2}\\). A linear recurrence does the same with constant coefficients.",
          ],
          checkpoints: [
            {
              prompt: "What is 1 + 2 + … + 100?",
              options: ["5000", "5050", "5100", "10100"],
              answer: 1,
              explanation: "Pair the ends: 50 pairs, each summing to 101, gives 5050.",
            },
            {
              prompt: "Geometric sequence with a₁ = 3 and r = 2. What is a₅?",
              options: ["24", "48", "96", "15"],
              answer: 1,
              explanation: "a₅ = 3·2⁴ = 48.",
            },
          ],
        },
        {
          id: "graph-theory",
          title: "Graph Theory",
          thumb: { icon: Graph, color: "#009CDE" },
          Visual: GraphBuilder,
          visualHint: "Click empty space to add a vertex; click two vertices to toggle an edge. Below, test whether a degree sequence can exist.",
          body: [
            "A vertex's degree is the number of edges touching it. Each edge adds 2 to the total, so the degrees always sum to twice the edge count:",
            "\\[\\sum_{v \\in V} \\deg(v) = 2|E|\\]",
            "\\(K_n\\), the complete graph, has every possible edge: \\(\\frac{n(n-1)}{2}\\) of them. The complement of G has the same vertices and exactly the edges G lacks.",
            "A graph can be stored as an adjacency matrix (row i, column j is 1 when i and j are joined) or as an adjacency list of each vertex's neighbours.",
          ],
          checkpoints: [
            {
              prompt: "Can a graph have degree sequence (3, 3, 2, 1)?",
              options: ["Yes", "No, the degree sum is odd", "No, 3 is too large", "Only if it has a loop"],
              answer: 1,
              explanation: "3 + 3 + 2 + 1 = 9 is odd, but the degree sum must be twice the edge count.",
            },
            {
              prompt: "A graph on 6 vertices has 7 edges. How many edges does its complement have?",
              options: ["7", "8", "15", "9"],
              answer: 1,
              explanation: "K₆ has 15 edges, so the complement has 15 − 7 = 8.",
            },
          ],
        },
      ],
    },
  ],
};
