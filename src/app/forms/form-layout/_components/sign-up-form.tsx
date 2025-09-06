import InputGroup from "@/components/FormElements/InputGroup";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { Button } from "@/components/ui-elements/button";

export default function SignUpForm() {
  return (
    <ShowcaseSection title="Sign Up Form" className="!p-6.5">
      <form action="#">
        <InputGroup
          label="Name"
          type="text"
          placeholder="Enter full name"
          className="mb-4.5"
        />

        <InputGroup
          label="Email"
          type="email"
          placeholder="Enter email address"
          className="mb-4.5"
        />

        <InputGroup
          label="Password"
          type="password"
          placeholder="Enter password"
          className="mb-4.5"
        />

        <InputGroup
          label="Re-type Password"
          type="password"
          placeholder="Re-type password"
          className="mb-5.5"
        />

        <div className="mt-4">
          <Button label="Create Account" variant="primary" shape="rounded" className="w-full" />
        </div>
      </form>
    </ShowcaseSection>
  );
}
