import { Checkbox } from "@/components/FormElements/checkbox";
import InputGroup from "@/components/FormElements/InputGroup";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import Link from "next/link";
import { Button } from "@/components/ui-elements/button";

export default function SignInForm() {
  return (
    <ShowcaseSection title="Sign In Form" className="!p-6.5">
      <form action="#">
        <InputGroup
          label="Email"
          type="email"
          placeholder="Enter your email address"
          className="mb-4.5"
        />

        <InputGroup
          label="Password"
          type="password"
          placeholder="Enter your password"
        />

        <div className="mb-5.5 mt-5 flex items-center justify-between">
          <Checkbox label="Remember me" minimal withBg withIcon="check" />

          <Link href="#" className="text-body-sm text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <div className="mt-4">
          <Button label="Sign In" variant="primary" shape="rounded" className="w-full" />
        </div>
      </form>
    </ShowcaseSection>
  );
}
