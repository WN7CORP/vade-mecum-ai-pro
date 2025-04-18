
import Layout from "@/components/Layout";

// Estilos globais específicos
const styles = `
.text-gradient-primary {
  background: linear-gradient(to right, #9b87f5, #7E69AB);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  display: inline;
}
`;

const Index = () => {
  return (
    <>
      <style>{styles}</style>
      <Layout />
    </>
  );
};

export default Index;
