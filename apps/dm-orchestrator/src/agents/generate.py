from __future__ import annotations

from threading import Thread
from typing import Generator

from transformers import TextIteratorStreamer

from src.model_loader import get_input_device, get_model, get_tokenizer
from src.schemas import DeltaChunk


def generate_agent_response(
    system_prompt: str,
    user_prompt: str,
    max_new_tokens: int = 256,
    temperature: float = 0.7,
    do_sample: bool = True,
) -> str:
    model = get_model()
    tokenizer = get_tokenizer()
    device = get_input_device()

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    input_ids = tokenizer.apply_chat_template(
        messages,
        return_tensors="pt",
        add_generation_prompt=True,
        return_dict=False,
    ).to(device)

    output_ids = model.generate(
        input_ids=input_ids,
        max_new_tokens=max_new_tokens,
        temperature=temperature,
        do_sample=do_sample,
        top_p=0.9,
        top_k=40,
        repetition_penalty=1.3,
    )

    return tokenizer.decode(
        output_ids[0][input_ids.shape[1]:],
        skip_special_tokens=True,
    ).strip()


def stream_agent_response(
    system_prompt: str,
    user_prompt: str,
    max_new_tokens: int = 512,
    temperature: float = 0.7,
) -> Generator[DeltaChunk, None, str]:
    model = get_model()
    tokenizer = get_tokenizer()
    device = get_input_device()

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    input_ids = tokenizer.apply_chat_template(
        messages,
        return_tensors="pt",
        add_generation_prompt=True,
        return_dict=False,
    ).to(device)

    streamer = TextIteratorStreamer(
        tokenizer, skip_prompt=True, skip_special_tokens=True,
    )
    gen_kwargs = {
        "input_ids": input_ids,
        "max_new_tokens": max_new_tokens,
        "temperature": temperature,
        "do_sample": True,
        "top_p": 0.9,
        "top_k": 40,
        "repetition_penalty": 1.3,
        "streamer": streamer,
    }

    Thread(target=model.generate, kwargs=gen_kwargs, daemon=True).start()

    full = ""
    for token in streamer:
        full += token
        yield DeltaChunk(content=token)
    return full
