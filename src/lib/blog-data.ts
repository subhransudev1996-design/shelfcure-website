export interface BlogPost {
  id: number;
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorRole: string;
  date: string;
  readTime: string;
  image: string;
  featured?: boolean;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 1,
    slug: "ai-revolutionizing-pharmacy-invoices",
    category: "AI & Innovation",
    title: "How Gemini AI is Revolutionizing Pharmacy Invoice Processing",
    excerpt: "Manual data entry is a relic of the past. Discover how deep learning models are achieving 99%+ accuracy in reading complex supplier bills.",
    content: `
      <p>The modern pharmacy is no longer just a place where medicines are dispensed; it is a high-tech node in the healthcare ecosystem. However, for many years, the "back-office" operations of these pharmacies remained stuck in the 1990s—especially when it came to supplier invoices.</p>
      
      <h3>The Problem with Manual Entry</h3>
      <p>Typically, a large pharmacy receives dozens of physical or PDF invoices every week. Each invoice contains hundreds of line items, batch numbers, expiry dates, and complex GST splits. Manually entering this data into a POS system is not only soul-crushing work for staff but also highly prone to error. A single digit mistake in a batch number can lead to compliance nightmares or inventory losses.</p>
      
      <h3>Enter Gemini AI</h3>
      <p>At ShelfCure, we’ve integrated Google's Gemini Pro Vision models to solve this specific bottleneck. Our OCR (Optical Character Recognition) engine doesn't just "read" text; it "understands" the structure of a pharmaceutical invoice. It knows where the Batch ID usually sits relative to the Product Name. It can cross-reference HSN codes with a global database to ensure tax compliance.</p>
      
      <blockquote>"By automating the extraction process, we've seen pharmacies reduce their billing entry time from 4 hours to just 15 minutes."</blockquote>
      
      <h3>99%+ Accuracy</h3>
      <p>Through iterative training and real-world feedback loops, our engine now handles handwritten notes, blurred thermal prints, and complex multi-page layouts with over 99.2% accuracy. This isn't just a convenience; it's a fundamental shift in how pharmacies operate, allowing pharmacists to spend more time with patients and less time with paper.</p>
      
      <p>As we continue to refine these models, the goal remains clear: to eliminate "busywork" from healthcare entirely.</p>
    `,
    author: "Dr. Aradhya Sharma",
    authorRole: "Head of AI Research",
    date: "May 12, 2025",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1587854230647-41215ad59af7?auto=format&fit=crop&q=80&w=1200",
    featured: true
  },
  {
    id: 2,
    slug: "reduce-inventory-waste-strategies",
    category: "Operations",
    title: "5 Strategies to Reduce Inventory Waste in Your Retail Pharmacy",
    excerpt: "Stock expiry is the silent killer of pharmacy profits. Learn how smart reorder points can save you thousands annually.",
    content: `
      <p>Inventory waste—primarily due to expired medications—is one of the largest controllable expenses in a retail pharmacy. In India alone, it is estimated that nearly 3-5% of stock is returned or discarded due to expiry. This represents a massive drain on profitability.</p>
      
      <h3>1. Implement First-Expiry, First-Out (FEFO)</h3>
      <p>It sounds simple, but many pharmacies still use FIFO (First-In, First-Out). In medicine, the manufacture date matters less than the expiry date. Organizing your shelves so that the earliest expiring products are at the front is critical.</p>
      
      <h3>2. Automated Expiry Alerts</h3>
      <p>ShelfCure provides 30, 60, and 90-day expiry windows. Instead of doing a manual "shelf sweep" once a month, our dashboard tells you exactly what needs to be moved or returned to the distributor today.</p>
      
      <h3>3. Smart Reorder Points</h3>
      <p>Overstocking is just as dangerous as understocking. By analyzing your last 6 months of sales data, AI can suggest "optimal" stock levels. You don't need 50 boxes of a slow-moving antibiotic if you only sell 2 a week.</p>
    `,
    author: "Rahul Mehta",
    authorRole: "Operations Specialist",
    date: "May 10, 2025",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&q=80&w=1200",
  },
  {
    id: 3,
    slug: "gst-compliance-guide-pharmacists",
    category: "Compliance",
    title: "The Ultimate Guide to GST Compliance for Indian Pharmacists",
    excerpt: "Navigating GSTR-1, HSN codes, and input tax credits doesn't have to be a nightmare with the right software tools.",
    content: `
      <p>GST compliance is often cited as the biggest administrative headache for pharmacy owners. Between varying tax slabs (5%, 12%, 18%) and the need for accurate HSN reporting, the margin for error is slim.</p>
      
      <h3>HSN Code Accuracy</h3>
      <p>One of the most common reasons for GST audit flags is incorrect HSN mapping. ShelfCure's database contains over 100,000 pre-verified HSN codes for Indian medications. When you scan an invoice, the system automatically suggests the correct code.</p>
      
      <h3>Input Tax Credit (ITC) Reversal</h3>
      <p>Did you know you have to reverse ITC on expired medicines? Manually tracking which expired items had which tax credit applied is nearly impossible. Our software automates this "Credit Note" generation, ensuring you stay 100% compliant with tax laws.</p>
    `,
    author: "Priya Varma",
    authorRole: "Tax & Compliance Lead",
    date: "May 08, 2025",
    readTime: "8 min read",
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=1200",
  },
  {
    id: 4,
    slug: "medplus-success-story-scaling",
    category: "Success Stories",
    title: "How MedPlus Scaled to 3 Locations in 12 Months",
    excerpt: "A deep dive into how MedPlus utilized ShelfCure's multi-store sync to maintain perfect inventory across branches.",
    content: `
      <p>Growth is exciting, but it brings complexity. When MedPlus decided to open their second and third branches, they realized that "walking across the store" to check stock was no longer an option.</p>
      
      <h3>Centralized Control</h3>
      <p>Using ShelfCure's Cloud Sync, the owner could see live sales data from all three locations on a single smartphone. They could identify if Branch A was overstocked on a product that Branch B was running out of, allowing for inter-store transfers instead of new purchases.</p>
      
      <h3>Consistency is Key</h3>
      <p>By using a unified database, patient records were available at any branch. If a customer bought their heart medication at the Downtown branch, they could easily get a refill at the Uptown branch without having to explain their history again.</p>
    `,
    author: "Siddharth Rao",
    authorRole: "Product Manager",
    date: "May 05, 2025",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?auto=format&fit=crop&q=80&w=1200",
  }
];
