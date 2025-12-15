
import React, { ComponentProps } from "react";
import { Option, update as updateOptions } from "../../ducks/options";
import classnames from "classnames";
import { useAppDispatch, useAppSelector } from "../../ducks";

const stopPropagation = (e) => {
    if (e.key !== "Escape") {
        e.stopPropagation();
    }
};

interface OptionProps<S>
    extends Omit<
        ComponentProps<"input"> &
            ComponentProps<"select"> &
            ComponentProps<"textarea">,
        "value" | "onChange"
    > {
    value: S;
    onChange: (value: S) => any;
}

function BooleanOption({ value, onChange, ...props }: OptionProps<boolean>) {
    return (
        <div className="checkbox">
            <label>
                <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => onChange(e.target.checked)}
                    {...props}
                />
                Enable
            </label>
        </div>
    );
}

function StringOption({ value, onChange, ...props }: OptionProps<string>) {
    return (
        <input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            {...props}
        />
    );
}

function Optional(Component) {
    return function OptionalWrapper({ onChange, ...props }) {
        return (
            <Component onChange={(x) => onChange(x ? x : null)} {...props} />
        );
    };
}

function NumberOption({ value, onChange, ...props }: OptionProps<number>) {
    return (
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            {...props}
        />
    );
}

function FloatOption({ value, onChange, ...props }: OptionProps<number>) {
    return (
        <input
            type="number"
            step="any"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            {...props}
        />
    );
}

interface ChoiceOptionProps extends OptionProps<string> {
    choices: string[];
}

export function ChoicesOption({
    value,
    onChange,
    choices,
    ...props
}: ChoiceOptionProps) {
    return (
        <select
            onChange={(e) => onChange(e.target.value)}
            value={value}
            {...props}
        >
            {choices.map((choice) => (
                <option key={choice} value={choice}>
                    {choice}
                </option>
            ))}
        </select>
    );
}

function StringSequenceOption({
    value,
    onChange,
    ...props
}: OptionProps<string[]>) {
    const height = Math.max(value.length, 1);

    const [textAreaValue, setTextAreaValue] = React.useState(value.join("\n"));

    const handleChange = (e) => {
        const newValue = e.target.value;
        setTextAreaValue(newValue); 
        onChange(
            
            newValue
                .split("\n")
                .map((line) => line.trim())
                .filter((line) => line !== ""),
        );
    };

    return (
        <textarea
            rows={height}
            value={textAreaValue}
            onChange={handleChange}
            {...props}
        />
    );
}

export const Options = {
    bool: BooleanOption,
    str: StringOption,
    int: NumberOption,
    float: FloatOption,
    "optional str": Optional(StringOption),
    "optional int": Optional(NumberOption),
    "optional float": Optional(FloatOption),
    "sequence of str": StringSequenceOption,
};

function PureOption({ choices, type, value, onChange, name, error }) {
    let Opt;
    const props: Partial<OptionProps<any> & ChoiceOptionProps> = {
        onChange,
        value,
    };
    if (choices) {
        Opt = ChoicesOption;
        props.choices = choices;
    } else {
        Opt = Options[type];
        if (!Opt) throw `unknown option type ${type}`;
    }
    if (Opt !== BooleanOption) {
        props.className = "form-control";
    }

    return (
        <div className={classnames({ "has-error": error })}>
            <Opt name={name} onKeyDown={stopPropagation} {...props} />
        </div>
    );
}

export default function OptionInput({ name }: { name: Option }) {
    const dispatch = useAppDispatch();
    const choices = useAppSelector(
        (state) => {
            if (!state || !state.options_meta) return undefined;
            return state.options_meta[name]?.choices;
        },
    );
    const type = useAppSelector((state) => {
        if (!state || !state.options_meta) return undefined;
        return state.options_meta[name]?.type;
    });
    const value = useAppSelector((state) => {
        if (!state) return undefined;
        const editState = state.ui?.optionsEditor?.[name];
        if (editState) return editState.value;
        if (!state.options_meta) return undefined;
        return state.options_meta[name]?.value;
    });
    const error = useAppSelector(
        (state) => {
            if (!state || !state.ui?.optionsEditor) return undefined;
            return state.ui.optionsEditor[name]?.error;
        },
    );

    return (
        <PureOption
            name={name}
            choices={choices}
            type={type}
            value={value}
            error={error}
            onChange={(value) => dispatch(updateOptions(name, value))}
        />
    );
}
