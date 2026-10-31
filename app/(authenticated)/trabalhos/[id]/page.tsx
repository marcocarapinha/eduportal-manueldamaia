import TrabalhoDetalheClient from "./trabalho-detalhe-client";
export default function Page({ params }: { params: { id: string } }) {
  return <TrabalhoDetalheClient id={params?.id ?? ""} />;
}
