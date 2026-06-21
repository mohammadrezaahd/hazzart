const Home = () => {
  return (
    <main className="flex flex-col bg-white h-screen w-full">
      <header className="flex justify-between items-center w-full shrink-0 px-6 py-4">
        <div className="logo font-bold text-4xl">GHAZAL SHAFIEI</div>
        <div className="modes flex flex-col">
          <div>DESK MODE</div>
          <div>LIST MODE</div>
        </div>
        <div className="nav flex flex-col">
          <div>DIGITAL ARTWORK</div>
          <div>TRADITIONAL ARTWORK</div>
          <div>GRAPHIC DESIGN</div>
        </div>
        <div className="pages flex flex-col">
          <div>CONTACT</div>
          <div>ABOUT</div>
        </div>
      </header>

      <section className="flex-1 min-h-0 w-full"></section>

      <footer className="bg-[#1E1E1E] flex justify-between items-center self-center shrink-0 px-3 py-4 gap-3">
        <button className="bg-black text-white p-2">YEARLY</button>
        <button className="bg-black text-white p-2">SERIES</button>
        <button className="bg-black text-white p-2">RANDOM</button>
        <button className="bg-black text-white p-2">RECENT</button>
      </footer>
    </main>
  );
};

export default Home;
