import InputGroup from "@/components/FormElements/InputGroup";
import { TextAreaGroup } from "@/components/FormElements/InputGroup/text-area";
import { Select } from "@/components/FormElements/select";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { Button } from "@/components/ui-elements/button";

export default function ContactForm() {
  return (
    <ShowcaseSection title="Contact Form" className="!p-6.5">
      <form action="#">
        <div className="mb-4.5 flex flex-col gap-4.5 xl:flex-row">
          <InputGroup
            label="First name"
            type="text"
            placeholder="Enter your first name"
            className="w-full xl:w-1/2"
          />

          <InputGroup
            label="Last name"
            type="text"
            placeholder="Enter your last name"
            className="w-full xl:w-1/2"
          />
        </div>

        <InputGroup
          label="Email"
          type="email"
          placeholder="Enter your email address"
          className="mb-4.5"
          required
        />

        <InputGroup
          label="Subject"
          type="text"
          placeholder="Enter your subject"
          className="mb-4.5"
        />

        <Select
          label="Subject"
          placeholder="Select your subject"
          className="mb-4.5"
          items={[
            { label: "United States", value: "USA" },
            { label: "United Kingdom", value: "UK" },
            { label: "Canada", value: "Canada" },
          ]}
        />

        <TextAreaGroup label="Message" placeholder="Type your message" />

        <div className="mt-6">
          <Button label="Send Message" variant="primary" shape="rounded" className="w-full" />
        </div>
      </form>
    </ShowcaseSection>
  );
}
