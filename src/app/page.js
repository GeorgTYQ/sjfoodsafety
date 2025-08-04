import Image from "next/image";
import Link from "next/link";
export default function Home() {
  return (
    <div>
      <Link href="/records" className="text-blue-500 hover:underline">
        Fridge
      </Link>
    </div>
  );
}
