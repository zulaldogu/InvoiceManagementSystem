const modules = [
  {
    title: "Customers",
    description: "Manage customer account records and customer details.",
    status: "Backend ready",
  },
  {
    title: "Products",
    description: "Manage products and services used in invoice lines.",
    status: "Backend ready",
  },
  {
    title: "Invoices",
    description: "Create invoice headers, add line items, and calculate totals.",
    status: "Backend ready",
  },
  {
    title: "Roles & Profiles",
    description: "Control user permissions with role and profile assignments.",
    status: "Backend ready",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 px-8 py-10 text-slate-100">
      <section className="mx-auto max-w-6xl">
        <div className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">
            Invoice Management System
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">
            Frontend development workspace
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
            This interface will be connected to the FastAPI backend modules for
            customer, product, invoice, and authorization management.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {modules.map((module) => (
            <article
              key={module.title}
              className="rounded-lg border border-slate-800 bg-slate-900 p-6"
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold">{module.title}</h2>
                <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
                  {module.status}
                </span>
              </div>
              <p className="text-sm leading-6 text-slate-300">
                {module.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}