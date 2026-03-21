export interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  content?: string;
  language?: string;
}

export const sampleContracts: FileNode[] = [
  {
    name: "injective-vault",
    type: "folder",
    children: [
      {
        name: "src",
        type: "folder",
        children: [
          {
            name: "lib.rs",
            type: "file",
            language: "rust",
            content: `#[cfg(test)]
mod tests;

use cosmwasm_std::{
    entry_point, to_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult,
};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct InstantiateMsg {}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum ExecuteMsg {
    SayHello { name: String },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum QueryMsg {
    GetHello { name: String },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct HelloResponse {
    pub message: String,
}

#[entry_point]
pub fn instantiate(
    _deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    _msg: InstantiateMsg,
) -> StdResult<Response> {
    Ok(Response::new())
}

#[entry_point]
pub fn execute(
    _deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: ExecuteMsg,
) -> StdResult<Response> {
    match msg {
        ExecuteMsg::SayHello { name } => {
            let msg = format!("Hello, {}!", name);
            Ok(Response::new().add_attribute("hello", msg))
        }
    }
}

#[entry_point]
pub fn query(
    _deps: Deps,
    _env: Env,
    msg: QueryMsg,
) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetHello { name } => {
            let res = HelloResponse {
                message: format!("Hello, {}!", name),
            };
            to_binary(&res)
        }
    }
}
`,
          },
          {
            name: "tests.rs",
            type: "file",
            language: "rust",
            content: `use cosmwasm_std::{
    from_binary,
    testing::{mock_dependencies, mock_env, mock_info},
};

use crate::{
    execute, instantiate, query,
    ExecuteMsg, InstantiateMsg, QueryMsg, HelloResponse,
};

#[test]
fn test_instantiate() {
    let mut deps = mock_dependencies();

    let msg = InstantiateMsg {};
    let info = mock_info("creator", &[]);

    let res = instantiate(deps.as_mut(), mock_env(), info, msg).unwrap();

    assert_eq!(res.messages.len(), 0);
}

#[test]
fn test_query_hello() {
    let deps = mock_dependencies();

    let msg = QueryMsg::GetHello {
        name: "Victor".to_string(),
    };

    let res = query(deps.as_ref(), mock_env(), msg).unwrap();
    let value: HelloResponse = from_binary(&res).unwrap();

    assert_eq!(value.message, "Hello, Victor!");
}

#[test]
fn test_execute_hello() {
    let mut deps = mock_dependencies();

    let msg = ExecuteMsg::SayHello {
        name: "Victor".to_string(),
    };

    let info = mock_info("sender", &[]);
    let res = execute(deps.as_mut(), mock_env(), info, msg).unwrap();

    let attr = res.attributes.iter().find(|a| a.key == "hello").unwrap();

    assert_eq!(attr.value, "Hello, Victor!");
}
`,
          },
        ],
      },
      {
        name: "Cargo.toml",
        type: "file",
        language: "toml",
        content: `[package]
name = "injective-vault"
version = "0.1.0"
authors = ["Injective Developer <dev@injective.network>"]
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
cosmwasm-std = "1.1.0"
cw-storage-plus = "1.0.1"
schemars = "0.8.10"
serde = { version = "1.0.145", default-features = false, features = ["derive"] }
thiserror = "1.0.37"

[dev-dependencies]
cosmwasm-schema = "1.1.0"
cw-multi-test = "0.15.1"
`,
      },
    ],
  },
];

export function findFile(nodes: FileNode[], path: string[]): FileNode | null {
  for (const node of nodes) {
    if (node.name === path[0]) {
      if (path.length === 1) return node;
      if (node.children) return findFile(node.children, path.slice(1));
    }
  }
  return null;
}
