import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
} from "~/components/ui/select";
import { type NextPage } from "next";
import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";

import React, { useEffect } from "react";
import { verifyZoneOnFileDrop, DropZone } from "~/components/DropZone";
import { Header } from "~/components/Header";
import { TranslationTable } from "~/components/TranslationTable";
import { TranslationContextInit } from "~/contexts/TranslationContext";
import { cn } from "~/lib/utils";
import { api } from "~/utils/api";
import NoSsr from "~/components/NoSsr";

const Home: NextPage = () => {
  // const hello = api.example.hello.useQuery({ text: "from tRPC" });

  // if (localStorage.theme === "dark" ||
  //   (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
  // ) {
  //   document.documentElement.classList.add("dark");
  // } else {
  //   document.documentElement.classList.remove("dark");
  // }

  // useEffect(() => {
  //   document.documentElement.classList.add("dark");
  // }, []);

  return (
    <>
      <Head>
        <title>Community translations</title>
        <meta name="description" content="Community translations" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <TranslationContextInit>
        <NoSsr>
          <Header />
        </NoSsr>
        <main
          className="flex min-h-screen flex-col items-center justify-center bg-slate-900"
          onDragStart={verifyZoneOnFileDrop}
          onDragOver={verifyZoneOnFileDrop}
          onDrop={verifyZoneOnFileDrop}
        >
          <div className="container mt-8 flex flex-col items-center justify-center gap-12 px-4 py-16">
            <DropZone />
            <TranslationTable />
            {/* <div className="flex flex-col items-center gap-2">
              <p className="text-2xl text-white">{hello.data ? hello.data.greeting : "Loading tRPC query..."}</p>
              <AuthShowcase />
            </div> */}
          </div>
        </main>
      </TranslationContextInit>
    </>
  );
};

export default Home;

const AuthShowcase: React.FC = () => {
  const { data: sessionData } = useSession();

  const { data: secretMessage } = api.example.getSecretMessage.useQuery(
    undefined, // no input
    { enabled: sessionData?.user !== undefined }
  );

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl text-white">
        {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
        {secretMessage && <span> - {secretMessage}</span>}
      </p>
      <button
        className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
        onClick={sessionData ? () => void signOut() : () => void signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
};
