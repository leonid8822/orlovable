import { Header } from "@/components/Header";
import { ExamplesShowcase } from "@/components/ExamplesShowcase";

const Examples = () => {
  return (
    <div className="min-h-screen bg-gradient-dark">
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <ExamplesShowcase />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 ArtisanJewel. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
};

export default Examples;
